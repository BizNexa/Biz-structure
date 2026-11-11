/**
 * Eligibility engine. Pure functions, no UI dependencies.
 *
 *   assess(facts, asOf) -> Assessment
 *
 * Order (see rules/liability.yaml header):
 *   1. triggers (s.22, s.24)   2. exemptions (s.23)   3. MANDATORY if a trigger survives
 *   4. NEEDS_CA_REVIEW if anything decisive is unknown or contested
 *   5. VOLUNTARY_ELIGIBLE if the person wants it   6. otherwise NOT_REQUIRED
 */
import { UNKNOWN, type Facts } from './facts';
import { evalCondition, factsIn, type TV } from './logic';
import { computeThresholds, type ThresholdResult, INTEREST_CONFLICT_ID } from './thresholds';
import { RULESET, MIN_AS_OF, inForce, isPendingVerification, paramsAt, type CompiledRuleSet } from './ruleset';
import type { LiabilityRuleT, RouteT, DeadlineT, VerificationStatus } from '../rules/schema';

export type Verdict = 'MANDATORY' | 'VOLUNTARY_ELIGIBLE' | 'NOT_REQUIRED' | 'NEEDS_CA_REVIEW';

export interface Reason {
  rule_id: string;
  legal_basis: string;
  description: string;
  plain_language: string;
  verification_status: VerificationStatus;
  pending_verification: boolean;
  effect: 'requires_registration' | 'exempts' | 'displaced' | 'pending' | 'voluntary' | 'not_triggered';
  displaced_by?: string[];
}

export interface OpenQuestion {
  rule_id: string;
  question: string;
  missing_facts: string[];
  conflict_id?: string;
}

export interface RuleEval {
  id: string;
  kind: 'trigger' | 'exemption' | 'voluntary';
  result: TV;
}

export interface RouteConditionResult {
  id: string;
  description: string;
  result: TV;
  fail_message: string;
  verification_status: VerificationStatus;
}

export interface RouteResult {
  id: string;
  form: string;
  name: string;
  kind: RouteT['kind'];
  plain_language: string;
  status: 'eligible' | 'not_eligible' | 'unknown' | 'not_applicable';
  optional_route: boolean;
  conditions: RouteConditionResult[];
  failing: RouteConditionResult[];
  verification_status: VerificationStatus;
  pending_verification: boolean;
  timeline_ids: string[];
}

export interface Assessment {
  verdict: Verdict;
  headline: { rule_id: string; text: string } | null;
  reasons: Reason[];
  evaluations: RuleEval[];
  thresholds: ThresholdResult;
  assumptions: string[];
  open_questions: OpenQuestion[];
  deadlines: DeadlineT[];
  routes: RouteResult[];
  recommended_route_ids: string[];
  conflict_ids: string[];
  trace: string[];
  lifecycle_in_force: string[];
  meta: { ruleset_version: string; ruleset_hash: string; as_of: string };
}

/** Assessment for the facts on a date. */
export function assess(facts: Facts, asOf: string, rs: CompiledRuleSet = RULESET): Assessment {
  if (asOf < MIN_AS_OF) throw new RangeError(`as-of date ${asOf} is before ${MIN_AS_OF}, which the engine does not model`);
  const trace: string[] = [`as-of ${asOf}; rule set ${rs.meta.ruleset_version} (${rs.meta.ruleset_hash.slice(0, 12)})`];
  const params = paramsAt(rs, asOf);

  // ---- derived facts
  const thresholds = computeThresholds(rs, facts, asOf);
  trace.push(...thresholds.trace);
  const f: Facts = { ...facts, ...deriveFacts(rs, facts, asOf, thresholds) };
  const ctx = { facts: f, params };

  const active = rs.rules.filter((r) => inForce(r, asOf));
  const triggers = active.filter((r) => r.outcome === 'TRIGGER');
  const exemptions = active.filter((r) => r.outcome === 'EXEMPTION' && r.id !== 'EX-N10-2019-CT-GOODS-40L');
  const voluntary = active.filter((r) => r.outcome === 'VOLUNTARY');

  const evaluations: RuleEval[] = [];
  const ev = (r: LiabilityRuleT, kind: RuleEval['kind']) => {
    const result = evalCondition(r.applies_if, ctx);
    evaluations.push({ id: r.id, kind, result });
    trace.push(`${r.id} -> ${result}`);
    return result;
  };
  const trig = triggers.map((r) => ({ r, res: ev(r, 'trigger') }));
  const exem = exemptions.map((r) => ({ r, res: ev(r, 'exemption') }));
  const vol = voluntary.map((r) => ({ r, res: ev(r, 'voluntary') }));

  const reasons: Reason[] = [];
  const open: OpenQuestion[] = [];
  const assumptions: string[] = [];
  const conflictIds = new Set<string>();
  const firm: LiabilityRuleT[] = [];
  const pending: LiabilityRuleT[] = [];
  const askedFor = new Set<string>();

  const ask = (rule: LiabilityRuleT, conflict_id?: string, questionOverride?: string) => {
    const key = `${rule.id}|${conflict_id ?? ''}`;
    if (askedFor.has(key)) return;
    askedFor.add(key);
    const missing = [...factsIn(rule.applies_if)].filter((k) => f[k as keyof Facts] === undefined || f[k as keyof Facts] === UNKNOWN);
    open.push({ rule_id: rule.id, question: questionOverride ?? rule.ca_question, missing_facts: missing, conflict_id });
    if (conflict_id) conflictIds.add(conflict_id);
  };

  const displacesTrigger = (ex: LiabilityRuleT, t: LiabilityRuleT) =>
    (ex.scope === 'displaces' && (ex.displaces ?? []).includes(t.id)) || (ex.scope === 'blanket' && t.s23_override === 'displaced');
  const blanketTrue = exem.filter((e) => e.res === true && e.r.scope === 'blanket').map((e) => e.r);

  for (const { r: t, res } of trig) {
    if (res === false) continue;
    const defDisplacers = exem.filter((e) => e.res === true && displacesTrigger(e.r, t)).map((e) => e.r);
    const caDisplacers = defDisplacers.filter((e) => e.ca_confirmation_required);
    const cleanDisplacers = defDisplacers.filter((e) => !e.ca_confirmation_required);
    const maybeDisplacers = exem.filter((e) => e.res === UNKNOWN && displacesTrigger(e.r, t)).map((e) => e.r);
    const blanketOverlap = t.s23_override === 'ca_review' ? blanketTrue : [];

    if (cleanDisplacers.length) {
      reasons.push(reason(t, 'displaced', cleanDisplacers.map((d) => d.id)));
      continue;
    }
    if (res === UNKNOWN) {
      // Undecided trigger: it matters unless a (CA-flagged) exemption would displace it anyway.
      if (caDisplacers.length) caDisplacers.forEach((d) => ask(d));
      else ask(t);
      pending.push(t);
      reasons.push(reason(t, 'pending'));
      continue;
    }
    // res === true
    if (caDisplacers.length || blanketOverlap.length || maybeDisplacers.length) {
      caDisplacers.forEach((d) => ask(d));
      blanketOverlap.forEach((b) =>
        ask(t, 'C-005', `${t.ca_question} The client also appears exempt under ${b.id} (${b.legal_basis}); does s.23 override ${t.legal_basis} here?`),
      );
      maybeDisplacers.forEach((d) => ask(d));
      pending.push(t);
      reasons.push(reason(t, 'pending'));
      continue;
    }
    firm.push(t);
    reasons.push(reason(t, 'requires_registration'));
  }

  // Threshold ambiguity for goods + exempt interest (C-006) shows up as S22-1 unknown: cite the conflict.
  if (thresholds.interest_ambiguity) {
    const s22 = rs.rules.find((r) => r.id === 'S22-1-THRESHOLD')!;
    ask(
      s22,
      INTEREST_CONFLICT_ID,
      'Turnover is between the Rs 20 lakh and Rs 40 lakh limits and the only services are exempt interest/discount. Does Notification 10/2019-CT still apply (two schools of thought, handbook p. 5-6)?',
    );
  }

  for (const { r: e, res } of exem) {
    if (res === true) {
      reasons.push(reason(e, 'exempts'));
      if (e.ca_confirmation_required) ask(e);
    }
  }

  // ---- verdict
  let verdict: Verdict;
  let headline: Assessment['headline'] = null;
  const volRes = vol[0]?.res ?? false;
  if (firm.length) {
    verdict = 'MANDATORY';
    headline = { rule_id: firm[0].id, text: firm[0].plain_language };
  } else if (pending.length || open.some((q) => q.rule_id !== 'VOL-S25-3')) {
    verdict = 'NEEDS_CA_REVIEW';
    headline = { rule_id: open[0]?.rule_id ?? pending[0].id, text: 'Some answers are missing or the law is unsettled for these facts. A CA needs to resolve the open questions below.' };
  } else if (volRes === true) {
    verdict = 'VOLUNTARY_ELIGIBLE';
    reasons.push(reason(vol[0].r, 'voluntary'));
    headline = { rule_id: vol[0].r.id, text: vol[0].r.plain_language };
  } else {
    verdict = 'NOT_REQUIRED';
    const ex = exem.find((e) => e.res === true && e.r.scope === 'blanket');
    const s22 = trig.find((t) => t.r.id === 'S22-1-THRESHOLD');
    if (ex) headline = { rule_id: ex.r.id, text: ex.r.plain_language };
    else if (f.supply_nature === 'no_outward_supplies')
      headline = { rule_id: 'S22-1-THRESHOLD', text: 'You make no outward supplies and none of the compulsory-registration cases apply.' };
    else if (s22 && s22.res === false)
      headline = { rule_id: 'S22-1-THRESHOLD', text: 'Your turnover is within the registration limit and none of the compulsory-registration cases apply.' };
    if (volRes === UNKNOWN) assumptions.push('You did not say whether you want to register voluntarily. Voluntary registration (s.25(3)) remains open to you.');
    else assumptions.push('Voluntary registration under s.25(3) remains available if you want input tax credit or GST-registered customers.');
  }

  // Explain "not required / voluntary" with the threshold test that was passed.
  if (verdict === 'NOT_REQUIRED' || verdict === 'VOLUNTARY_ELIGIBLE') {
    const s22 = trig.find((t) => t.r.id === 'S22-1-THRESHOLD');
    if (s22 && s22.res === false && !reasons.some((r) => r.rule_id === s22.r.id)) reasons.unshift(reason(s22.r, 'not_triggered'));
  }

  // ---- assumptions surfaced to the user
  if (typeof f.aggregate_turnover_lakh === 'number')
    assumptions.push(`Aggregate turnover of Rs ${f.aggregate_turnover_lakh} lakh is taken as computed under s.2(6): all-India, PAN level, including exempt supplies and exports, excluding taxes and RCM inward supplies.`);
  if (f.rcm_liable_inward === true) assumptions.push('Reverse-charge liability is taken as applying to you as an unregistered recipient under a s.9(3) notification.');
  if (thresholds.states.length > 1) assumptions.push('Liability under s.22(1) is tested State by State, using all-India aggregate turnover against each State limit.');

  // ---- conflicts touched by the rules that mattered
  const relevantIds = new Set([...firm, ...pending].map((r) => r.id).concat(reasons.map((r) => r.rule_id)));
  for (const c of rs.conflicts) if (c.status === 'open' && c.related_ids.some((id) => relevantIds.has(id))) conflictIds.add(c.id);

  // ---- deadlines
  const dlIds = new Set<string>();
  for (const r of [...firm, ...pending]) r.deadline_ids.forEach((d) => dlIds.add(d));
  if (verdict === 'VOLUNTARY_ELIGIBLE') vol[0].r.deadline_ids.forEach((d) => dlIds.add(d));
  const deadlines = rs.deadlines.filter((d) => dlIds.has(d.id) && inForce(d, asOf) && (!d.applies_if || evalCondition(d.applies_if, ctx) !== false));

  // ---- routes
  const routes = rs.routes.filter((r) => inForce(r, asOf)).sort((a, b) => a.priority - b.priority).map((r) => evalRoute(r, ctx));
  const recommended = recommendRoutes(verdict, [...firm, ...pending], routes, f, verdict === 'VOLUNTARY_ELIGIBLE');
  for (const id of recommended) {
    const rr = routes.find((r) => r.id === id)!;
    rr.conditions.forEach((c) => {
      for (const k of rs.conflicts) if (k.status === 'open' && k.related_ids.includes(c.id)) conflictIds.add(k.id);
    });
  }
  trace.push(`verdict ${verdict}; routes ${recommended.join(', ') || 'none'}`);

  return {
    verdict,
    headline,
    reasons,
    evaluations,
    thresholds,
    assumptions,
    open_questions: open,
    deadlines,
    routes,
    recommended_route_ids: recommended,
    conflict_ids: [...conflictIds].sort(),
    trace,
    lifecycle_in_force: rs.lifecycle.filter((l) => inForce(l, asOf)).map((l) => l.id),
    meta: { ruleset_version: rs.meta.ruleset_version, ruleset_hash: rs.meta.ruleset_hash, as_of: asOf },
  };
}

function reason(r: LiabilityRuleT, effect: Reason['effect'], displaced_by?: string[]): Reason {
  return {
    rule_id: r.id,
    legal_basis: r.legal_basis,
    description: r.description,
    plain_language: r.plain_language,
    verification_status: r.verification_status,
    pending_verification: isPendingVerification(r.verification_status),
    effect,
    displaced_by,
  };
}

export function deriveFacts(rs: CompiledRuleSet, facts: Facts, asOf: string, thr: ThresholdResult): Facts {
  const st = typeof facts.ppob_state === 'string' ? rs.states.find((s) => s.code === facts.ppob_state && inForce(s, asOf)) : undefined;
  const reg = facts.existing_registrations_same_pan;
  const special =
    facts.non_resident_occasional === true || facts.oidar_from_outside_to_nonregistered === true || facts.online_money_gaming_from_outside === true;
  return {
    ppob_state_category: st?.threshold_category ?? UNKNOWN,
    has_regular_registration_other_state:
      reg === 'other_states' || reg === 'same_and_other_states' ? true : reg === 'none' || reg === 'same_state' ? false : UNKNOWN,
    normal_taxpayer_category: !special,
    turnover_within_base_threshold: thr.turnover_within_base_threshold,
    turnover_within_applicable_threshold: thr.turnover_within_applicable_threshold,
    preceding_turnover_within_applicable_threshold: thr.preceding_turnover_within_applicable_threshold,
  };
}

function evalRoute(r: RouteT, ctx: { facts: Facts; params: Record<string, number> }): RouteResult {
  const relevant = evalCondition(r.relevant_if, ctx);
  const conditions = r.conditions.map((c) => ({
    id: c.id,
    description: c.description,
    result: evalCondition(c.test, ctx),
    fail_message: c.fail_message,
    verification_status: c.verification_status,
  }));
  const failing = conditions.filter((c) => c.result === false);
  let status: RouteResult['status'];
  if (relevant === false) status = 'not_applicable';
  else if (failing.length) status = 'not_eligible';
  else if (relevant === UNKNOWN || conditions.some((c) => c.result === UNKNOWN)) status = 'unknown';
  else status = 'eligible';
  const pending = isPendingVerification(r.verification_status) || conditions.some((c) => isPendingVerification(c.verification_status));
  return {
    id: r.id,
    form: r.form,
    name: r.name,
    kind: r.kind,
    plain_language: r.plain_language,
    status,
    optional_route: r.optional_route,
    conditions,
    failing,
    verification_status: r.verification_status,
    pending_verification: pending,
    timeline_ids: r.timeline_ids,
  };
}

function recommendRoutes(verdict: Verdict, live: LiabilityRuleT[], routes: RouteResult[], f: Facts, isVoluntary: boolean): string[] {
  if (verdict === 'NOT_REQUIRED') return [];
  const byId = (id: string) => routes.find((r) => r.id === id);
  const out: string[] = [];
  const add = (id: string | undefined) => {
    if (id && byId(id) && byId(id)!.status !== 'not_applicable' && !out.includes(id)) out.push(id);
  };
  const hints = new Set(live.map((r) => r.route_hint).filter(Boolean) as string[]);
  if (isVoluntary) hints.add('ROUTE-REG01-NORMAL');
  // Special-category routes first, in priority order.
  routes.filter((r) => r.kind === 'special_category' && hints.has(r.id)).forEach((r) => add(r.id));
  // SEZ needs its own registration whenever the person registers at all.
  if (f.sez_unit_or_developer === true) add('ROUTE-REG01-SEZ');
  if (hints.has('ROUTE-REG01-NORMAL')) {
    const r14b = byId('ROUTE-RULE-14B');
    const r14a = byId('ROUTE-RULE-14A');
    // Rule 14B is for the target-State application of a seller already registered at home.
    if (r14b?.status === 'eligible') add(r14b.id);
    else if (r14a?.status === 'eligible') add(r14a.id);
    else add('ROUTE-REG01-NORMAL');
    const ms = byId('ROUTE-MULTISTATE');
    if (ms && ms.status !== 'not_applicable') add(ms.id);
  }
  return out;
}
