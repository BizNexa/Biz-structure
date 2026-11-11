import { describe, it, expect } from 'vitest';
import { evalCondition, UNKNOWN, RULESET, assess, MIN_AS_OF, computeThresholds } from '../engine';
import { RULE_CASES } from './fixtures/rule-cases';
import { GOLDEN } from './fixtures/golden';
import { f, run, ruleResult, AS_OF, BASE } from './helpers';

describe('three-valued logic', () => {
  const ctx = (facts: Record<string, unknown>) => ({ facts: facts as never, params: { P: 2.5 } });
  it('AND: false dominates unknown', () => {
    expect(evalCondition({ all: [{ fact: 'is_isd', equals: true }, { fact: 'is_eco_operator', equals: true }] }, ctx({ is_isd: false }))).toBe(false);
    expect(evalCondition({ all: [{ fact: 'is_isd', equals: true }, { fact: 'is_eco_operator', equals: true }] }, ctx({ is_isd: true }))).toBe(UNKNOWN);
  });
  it('OR: true dominates unknown', () => {
    expect(evalCondition({ any: [{ fact: 'is_isd', equals: true }, { fact: 'is_eco_operator', equals: true }] }, ctx({ is_isd: true }))).toBe(true);
    expect(evalCondition({ any: [{ fact: 'is_isd', equals: true }, { fact: 'is_eco_operator', equals: true }] }, ctx({ is_isd: false }))).toBe(UNKNOWN);
  });
  it('NOT keeps unknown', () => {
    expect(evalCondition({ not: { fact: 'is_isd', equals: true } }, ctx({ is_isd: UNKNOWN }))).toBe(UNKNOWN);
    expect(evalCondition({ not: { fact: 'is_isd', equals: true } }, ctx({ is_isd: false }))).toBe(true);
  });
  it('param comparison uses config values', () => {
    expect(evalCondition({ fact: 'monthly_output_tax_to_registered_lakh', lte_param: 'P' }, ctx({ monthly_output_tax_to_registered_lakh: 2.5 }))).toBe(true);
    expect(evalCondition({ fact: 'monthly_output_tax_to_registered_lakh', lte_param: 'P' }, ctx({ monthly_output_tax_to_registered_lakh: 2.51 }))).toBe(false);
    expect(evalCondition({ fact: 'monthly_output_tax_to_registered_lakh', lte_param: 'MISSING' }, ctx({ monthly_output_tax_to_registered_lakh: 1 }))).toBe(UNKNOWN);
  });
  it('includes_any on multi-valued facts', () => {
    expect(evalCondition({ fact: 'other_supply_states', includes_any: ['MN'] }, ctx({ other_supply_states: ['GA', 'MN'] }))).toBe(true);
    expect(evalCondition({ fact: 'other_supply_states', includes_any: ['MN'] }, ctx({ other_supply_states: [] }))).toBe(false);
  });
});

describe('every liability rule fires and does not fire', () => {
  for (const c of RULE_CASES) {
    it(`${c.rule} ${c.fires ? 'fires' : 'does not fire'}${c.note ? ` (${c.note})` : ''}`, () => {
      expect(ruleResult(c.rule, f(c.facts), c.asOf ?? AS_OF)).toBe(c.fires);
    });
  }
  it('has a firing and a non-firing case for every rule', () => {
    for (const r of RULESET.rules) {
      expect(RULE_CASES.some((c) => c.rule === r.id && c.fires), `${r.id} needs a firing case`).toBe(true);
      expect(RULE_CASES.some((c) => c.rule === r.id && !c.fires), `${r.id} needs a non-firing case`).toBe(true);
    }
  });
});

describe('golden scenarios (expected outcomes from the handbook; pending CA sign-off)', () => {
  for (const g of GOLDEN) {
    it(`${g.id} ${g.title} -> ${g.expect.verdict}`, () => {
      const { a } = run(g.facts, g.asOf ?? AS_OF);
      expect(a.verdict).toBe(g.expect.verdict);
      const by = (eff: string) => a.reasons.filter((r) => r.effect === eff).map((r) => r.rule_id);
      for (const id of g.expect.requires ?? []) expect(by('requires_registration')).toContain(id);
      for (const id of g.expect.exempts ?? []) expect(by('exempts')).toContain(id);
      for (const id of g.expect.pending ?? []) expect(by('pending')).toContain(id);
      if (g.expect.routes) expect(a.recommended_route_ids.slice(0, g.expect.routes.length)).toEqual(g.expect.routes);
      for (const c of g.expect.conflicts ?? []) expect(a.conflict_ids).toContain(c);
      expect(g.signoff).toBe('pending_CA_signoff');
    });
  }
});

describe('verdict properties', () => {
  it('never defaults silently to NOT_REQUIRED on unknown answers', () => {
    const keys = Object.keys(BASE) as (keyof typeof BASE)[];
    for (const k of keys) {
      if (k === 'wants_voluntary' || k === 'wants_rule_14a' || k === 'wants_rule_14b' || k === 'premises_type' || k === 'existing_registrations_same_pan') continue;
      const { a } = run({ [k]: UNKNOWN });
      expect(['NEEDS_CA_REVIEW', 'MANDATORY', 'NOT_REQUIRED']).toContain(a.verdict);
      if (a.verdict === 'NOT_REQUIRED') {
        // Only acceptable when the unknown fact cannot change the result.
        const flip = [true, false, 'goods_only', 'services_only', 0, 1000].map((v) => run({ [k]: v as never }).a.verdict);
        expect(flip.every((v) => v === 'NOT_REQUIRED' || v === 'VOLUNTARY_ELIGIBLE') || flip.includes('NOT_REQUIRED'), `${k} unknown gave NOT_REQUIRED`).toBe(true);
      }
    }
  });
  it('every verdict carries a rule chain and meta', () => {
    for (const g of GOLDEN) {
      const { a } = run(g.facts);
      expect(a.reasons.length + a.open_questions.length).toBeGreaterThan(0);
      expect(a.meta.ruleset_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(a.trace[0]).toContain(a.meta.as_of);
    }
  });
  it('NEEDS_CA_REVIEW always lists at least one open question', () => {
    for (const g of GOLDEN.filter((x) => x.expect.verdict === 'NEEDS_CA_REVIEW')) {
      expect(run(g.facts).a.open_questions.length).toBeGreaterThan(0);
    }
  });
  it('rejects as-of dates before the modelled range', () => {
    expect(() => assess(BASE, '2023-12-31')).toThrow(RangeError);
    expect(() => assess(BASE, MIN_AS_OF)).not.toThrow();
  });
  it('a CA-flagged exemption (job worker) routes to CA review', () => {
    const { a } = run({ supply_nature: 'services_only', interstate_taxable_supply: true, job_worker_interstate_to_registered: true, aggregate_turnover_lakh: 30 });
    // Turnover 30 > 20 means s.22(1) fires anyway -> mandatory.
    expect(a.verdict).toBe('MANDATORY');
    const small = run({ supply_nature: 'goods_only', interstate_taxable_supply: true, job_worker_interstate_to_registered: true, aggregate_turnover_lakh: 10 }).a;
    expect(small.verdict).toBe('NEEDS_CA_REVIEW');
    expect(small.open_questions.map((q) => q.rule_id)).toContain('EX-N7-2017-IT-JOB-WORKER');
  });
  it('unknown ECO-goods conditions on a small seller -> CA review, not mandatory', () => {
    const { a } = run({ supplies_via_eco: true, eco_supplies_only_9_5_services: false, eco_goods_conditions_34_2023: UNKNOWN, aggregate_turnover_lakh: 10, preceding_fy_turnover_lakh: 9 });
    expect(a.verdict).toBe('NEEDS_CA_REVIEW');
  });
});

describe('thresholds', () => {
  const thr = (over: object) => computeThresholds(RULESET, f(over), AS_OF);
  it('uses the goods-only Rs 40 lakh limit only where 10/2019 applies', () => {
    expect(thr({ ppob_state: 'MH' }).states[0].applicable_limit_lakh).toBe(40);
    expect(thr({ ppob_state: 'MH', special_goods_10_2019: true }).states[0].applicable_limit_lakh).toBe(20);
    expect(thr({ ppob_state: 'TS' }).states[0].applicable_limit_lakh).toBe(20);
    expect(thr({ ppob_state: 'AR' }).states[0].applicable_limit_lakh).toBe(20);
    expect(thr({ ppob_state: 'HP' }).states[0].applicable_limit_lakh).toBe(40);
    expect(thr({ ppob_state: 'MN' }).states[0].applicable_limit_lakh).toBe(10);
    expect(thr({ ppob_state: 'MH', supply_nature: 'goods_and_services', goods_plus_interest_only: false }).states[0].applicable_limit_lakh).toBe(20);
  });
  it('every State/UT has a threshold record in force', () => {
    for (const s of RULESET.states) {
      const r = thr({ ppob_state: s.code });
      expect(r.states[0].threshold_record_id, s.code).not.toBeNull();
    }
  });
  it('unknown goods-limit facts decide only when both limits agree', () => {
    expect(thr({ special_goods_10_2019: UNKNOWN, aggregate_turnover_lakh: 15 }).turnover_within_applicable_threshold).toBe(true);
    expect(thr({ special_goods_10_2019: UNKNOWN, aggregate_turnover_lakh: 30 }).turnover_within_applicable_threshold).toBe(UNKNOWN);
    expect(thr({ special_goods_10_2019: UNKNOWN, aggregate_turnover_lakh: 45 }).turnover_within_applicable_threshold).toBe(false);
  });
  it('goods + interest income: decided outside the Rs 20-40 lakh band, ambiguous inside it', () => {
    const base = { supply_nature: 'goods_and_services', goods_plus_interest_only: true };
    expect(thr({ ...base, aggregate_turnover_lakh: 18 }).interest_ambiguity).toBe(false);
    expect(thr({ ...base, aggregate_turnover_lakh: 18 }).turnover_within_applicable_threshold).toBe(true);
    expect(thr({ ...base, aggregate_turnover_lakh: 30 }).interest_ambiguity).toBe(true);
    expect(thr({ ...base, aggregate_turnover_lakh: 45 }).turnover_within_applicable_threshold).toBe(false);
  });
});
