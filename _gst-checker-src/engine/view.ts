/**
 * Result view: everything the web page and the PDF report show, worded for a business owner.
 * Built only from the assessment, the checklist and the rule data.
 */
import type { Facts } from './facts';
import type { Assessment, Verdict } from './evaluate';
import { afterRegistrationNotes, CATEGORY_ORDER, type Checklist, type ChecklistRow } from './checklist';
import { RULESET, inForce, type CompiledRuleSet } from './ruleset';

export interface RouteCard {
  id: string;
  name: string;
  form: string;
  text: string;
}
export interface OptionCard {
  id: string;
  name: string;
  text: string;
  conditions: string[];
}
export interface PortalStep {
  title: string;
  detail: string;
}

export interface ResultView {
  verdict: Verdict;
  headline: string;
  stateName: string | null;
  stateLimitLakh: number | null;
  turnoverLakh: number | null;
  exceeded: boolean | null;
  reasons: string[];
  confirm: string[];
  routes: RouteCard[];
  options: OptionCard[];
  applyWithin: string | null;
  approval: string | null;
  deadlineDays: number | null;
  steps: PortalStep[];
  groups: { category: ChecklistRow['category']; rows: ChecklistRow[] }[];
  docCount: number;
  checklistIsVoluntary: boolean;
  beforeNotes: string[];
  afterNotes: string[];
  nextSteps: string[];
  lawDate: string;
  rulesetVersion: string;
  rulesetHash: string;
}

/** Rewrites practitioner-phrased questions ("the client") for the business owner. */
export function forOwner(q: string): string {
  return q
    .replace(/\bthe client's\b/gi, 'your')
    .replace(/\bDoes the client\b/g, 'Do you')
    .replace(/\bIs the client\b/g, 'Are you')
    .replace(/\bthe client\b/gi, 'you')
    .replace(/\bclient\b/gi, 'you');
}

/** Plain-language questions for the points most often left open. */
const OWNER_QUESTIONS: Record<string, string> = {
  'S22-1-THRESHOLD': 'What is your total turnover for this financial year (all sales across India under your PAN, including exempt sales and exports)?',
  'S22-3-TRANSFER': 'Are you taking over a GST-registered business as a going concern?',
  'S22-4-AMALGAMATION': 'Is your company receiving a business under an approved merger or demerger?',
  'S24-I-INTERSTATE': 'Do you sell to customers in other States, or export?',
  'S24-III-RCM': 'Are you actually required to pay GST under reverse charge on a purchase while unregistered? Some reverse-charge cases apply only to registered buyers.',
  'S24-IX-ECO-SUPPLIER': 'Do you sell through an online marketplace that collects TCS?',
  'EX-N34-2023-CT-ECO-GOODS': 'Do you meet all conditions for small online sellers: sales within one State only, a GST enrolment number, and turnover within the limit this year and last year?',
  'EX-N7-2017-IT-JOB-WORKER': 'Does the job-worker exemption for inter-State job work apply to you? Its conditions need to be checked against the notification.',
  'EX-ECO-MIXED-GOODS-SERVICES': 'Can the small-seller exemptions for goods and for services sold online be applied together in your case?',
  'EX-N10-2017-IT-SERVICES-EXPORTER': 'As a small exporter of services, are you covered by the exemption for inter-State services, or must you register like other exporters?',
};

const ROUTE_TEXT: Record<string, { name: string; conditions: (cap: number | undefined) => string[] }> = {
  'ROUTE-RULE-14A': {
    name: 'Rule 14A: simplified registration, approval in 3 working days',
    conditions: (cap) => [
      `Your monthly GST on sales to GST-registered buyers stays within ₹${cap} lakh`,
      'The authorised signatory and one promoter or partner complete Aadhaar authentication',
      'You do not already hold a Rule 14A registration in this State',
      'Not available to government bodies, PSUs or applicants who are not Indian citizens',
    ],
  },
  'ROUTE-RULE-14B': {
    name: 'Rule 14B: lighter registration for marketplace sellers entering a new State',
    conditions: (cap) => [
      'You already have a regular GST registration in another State',
      'You have no office and no regular registration in the new State',
      'You sell in the new State only through online marketplaces',
      `GST on sales to registered buyers stays within ₹${cap} lakh a month`,
      'Aadhaar and document verification within 15 days of applying',
    ],
  },
};

const REG01_STEPS: PortalStep[] = [
  { title: 'Part A', detail: 'On gst.gov.in enter PAN, mobile and e-mail; verify the OTPs.' },
  { title: 'Part B', detail: 'Within 15 days, fill in the business details and upload the documents.' },
  { title: 'Aadhaar', detail: 'Signatory and a promoter verify Aadhaar through the SMS link.' },
  { title: 'Submit', detail: 'Sign with DSC, e-sign or EVC and note your ARN.' },
  { title: 'GSTIN', detail: 'Usually 3 to 7 working days; up to 30 if a site visit is needed.' },
]

/** Short, plain name for a checklist row (drops form jargon in brackets). */
export function plainDocName(name: string): string {
  return name
    .replace(/\s*\((?:revised REG-01|MCA|OTP or biometric)[^)]*\)/gi, '')
    .replace(/^Premises proof - /, 'Address proof: ')
    .replace(/^Proof of appointment of authorised signatory$/, 'Authorisation letter for the signatory')
    .replace(/^Photograph of each promoter \/ partner \/ director \/ Karta \/ trustee$/, 'Photograph of each partner / director / Karta')
    .trim();
}

/** First sentence of a detail, so each checklist line stays short. */
export function firstSentence(text: string): string {
  const m = text.match(/^(.+?[.;])(\s|$)/);
  return (m ? m[1] : text).replace(/;$/, '.').trim();
}

/** Plain one-liners for the most common documents (other rows use the first sentence of the rule text). */
const PLAIN_DETAIL: Record<string, string> = {
  'DOC-PAN': 'PAN card of the business, or your own PAN if you are a proprietor. The name must match exactly.',
  'DOC-PARTNERSHIP-DEED': 'A copy of the signed partnership deed.',
  'DOC-PROMOTER-PHOTO': 'A recent photograph of each partner, director or Karta.',
  'DOC-AUTH-SIGNATORY-PROOF': 'A signed letter or board resolution naming the person who will sign for the business.',
  'DOC-AUTH-SIGNATORY-PHOTO': 'A recent photograph of the person signing (JPEG, up to 100 KB).',
  'DOC-BANK': 'First page of the passbook, a bank statement or a cancelled cheque.',
  'DOC-BANK-2026': 'First page of the passbook, a bank statement or a cancelled cheque.',
  'DOC-PPOB-OWNED': 'Any one: property tax receipt, municipal khata copy or electricity bill.',
  'DOC-PPOB-RENTED-REGISTERED': "Rent agreement plus one ownership proof of the owner, such as the owner's electricity bill.",
  'DOC-PPOB-RENTED-UNREGISTERED': "Rent agreement, one ownership proof of the owner and a copy of the owner's ID.",
  'DOC-PPOB-CONSENT': "Consent letter from the owner, the owner's ID and one ownership proof.",
};

/** The three tips worth reading before applying. */
const KEY_NOTES = ['NOTE-LEGAL-NAME-PAN', 'NOTE-AADHAAR-SPEED', 'NOTE-APOB'];

export function buildView(facts: Facts, a: Assessment, c: Checklist, rs: CompiledRuleSet = RULESET): ResultView {
  const asOf = a.meta.as_of;
  const ppob = a.thresholds.states[0];
  const turnover = typeof facts.aggregate_turnover_lakh === 'number' ? facts.aggregate_turnover_lakh : null;

  // Reasons that decide the result, in plain language.
  // Threshold reasons name the actual limit and State; other reasons use the rule's plain text.
  const lim = ppob?.applicable_limit_lakh ?? null;
  const where = ppob?.name ? ` in ${ppob.name}` : '';
  const exceededStates = a.thresholds.states.filter((s) => s.exceeded === true).map((s) => s.name);
  const thresholdText = (effect: string) =>
    effect === 'requires_registration'
      ? exceededStates.length > 1 || (exceededStates.length === 1 && exceededStates[0] !== ppob?.name)
        ? `Your all-India turnover is above the registration limit in ${exceededStates.join(', ')}.`
        : lim
          ? `Your turnover is above the ₹${lim} lakh registration limit that applies to your business${where}.`
          : null
      : lim
        ? `Your turnover is within the ₹${lim} lakh limit that applies to your business${where}, and none of the cases that need registration regardless of turnover apply to you.`
        : 'Your turnover is within the registration limit for your State.';
  const reasons = a.reasons
    .filter((r) => r.effect === 'requires_registration' || r.effect === 'exempts' || r.effect === 'not_triggered')
    .map((r) => (r.rule_id === 'S22-1-THRESHOLD' ? (thresholdText(r.effect) ?? r.plain_language) : r.plain_language))
    .filter(Boolean);
  const first = a.headline?.rule_id === 'S22-1-THRESHOLD' && reasons.length ? reasons[0] : null;
  const headline =
    a.verdict === 'NEEDS_CA_REVIEW' ? 'A few points need to be confirmed before we can give you a firm answer.' : (first ?? a.headline?.text ?? '');
  if (!reasons.length && headline) reasons.push(headline);

  const confirm = [...new Set(a.open_questions.map((q) => (q.conflict_id ? forOwner(q.question) : OWNER_QUESTIONS[q.rule_id] ?? forOwner(q.question))))];

  const routes: RouteCard[] = a.recommended_route_ids
    .map((id) => a.routes.find((r) => r.id === id)!)
    .filter((r) => r.kind !== 'normal' || r.id === 'ROUTE-REG01-NORMAL')
    .map((r) => ({ id: r.id, name: r.name, form: r.form, text: r.plain_language }));

  // Optional faster routes: shown when relevant and no known fact rules them out (except the opt-in itself).
  const options: OptionCard[] = [];
  const registering = a.verdict === 'MANDATORY' || a.verdict === 'NEEDS_CA_REVIEW';
  for (const id of ['ROUTE-RULE-14A', 'ROUTE-RULE-14B']) {
    const r = a.routes.find((x) => x.id === id);
    if (!r || !registering || r.status === 'not_applicable' || a.recommended_route_ids.includes(id)) continue;
    if (id === 'ROUTE-RULE-14A' && !a.recommended_route_ids.includes('ROUTE-REG01-NORMAL')) continue;
    const blocking = r.failing.filter((x) => !x.id.endsWith('-OPTED'));
    if (blocking.length) continue;
    const cap = rs.config.find((k) => k.id === (id === 'ROUTE-RULE-14A' ? 'RULE14A-MONTHLY-CAP-LAKH' : 'RULE14B-MONTHLY-CAP-LAKH'))?.value;
    options.push({ id, name: ROUTE_TEXT[id].name, text: r.plain_language, conditions: ROUTE_TEXT[id].conditions(cap) });
  }

  // At-a-glance timing.
  const dl = a.deadlines.map((d) => d.id);
  const applyWithin = !registering
    ? null
    : dl.includes('DL-CTP-NRTP-5-DAYS')
      ? '5 days before you start'
      : dl.includes('DL-S22-3-TRANSFER')
        ? 'From the date of takeover'
        : dl.includes('DL-S22-4-AMALGAMATION')
          ? 'From the ROC effective date'
          : dl.includes('DL-S25-1-30-DAYS')
            ? '30 days'
            : null;
  const deadlineDays = registering && dl.includes('DL-S25-1-30-DAYS') && !dl.includes('DL-CTP-NRTP-5-DAYS') ? 30 : null;
  const forms = new Set(routes.map((r) => r.form.match(/REG-\d+/)?.[0]));
  const approval = !registering
    ? null
    : forms.has('REG-07')
      ? '3 working days'
      : forms.has('REG-10')
        ? 'Not fixed by the rules'
        : a.recommended_route_ids.includes('ROUTE-RULE-14A')
          ? '3 working days'
          : '3 to 7 working days';

  const steps = registering && [...forms].some((f) => f === 'REG-01') ? REG01_STEPS : [];

  // Documents only when the person is (or may be) registering; one short line each.
  const groups = !registering
    ? []
    : CATEGORY_ORDER.filter((cat) => cat !== 'step')
        .map((category) => ({
          category,
          rows: c.rows
            .filter((r) => r.category === category)
            .map((r) => ({ ...r, name: plainDocName(r.name), detail: PLAIN_DETAIL[r.id] ?? firstSentence(r.detail) })),
        }))
        .filter((gr) => gr.rows.length);

  const nextSteps: string[] =
    a.verdict === 'NEEDS_CA_REVIEW'
      ? ['Share this report with a GST professional and settle the points to confirm.', 'Keep your sales records for the year ready; turnover decides most cases.', 'If registration is required, apply within 30 days of becoming liable.']
      : registering
        ? [
            applyWithin === '5 days before you start' ? 'Apply at least 5 days before your first sale in that State.' : 'Apply on gst.gov.in within 30 days of becoming liable.',
            `Collect the ${groups.reduce((n, g) => n + g.rows.length, 0)} items on the document checklist.`,
            'Keep the Aadhaar-linked mobiles of the signatory and a promoter handy for authentication.',
          ]
        : [
            'Track your turnover every month; registration is due within 30 days of crossing the limit.',
            'Check again before you sell to another State, export, or start selling on a marketplace.',
            'Consider voluntary registration if your buyers are GST-registered businesses.',
          ];

  return {
    verdict: a.verdict,
    headline,
    stateName: ppob?.name ?? null,
    stateLimitLakh: ppob?.applicable_limit_lakh ?? ppob?.base_limit_lakh ?? null,
    turnoverLakh: turnover,
    exceeded: ppob ? (ppob.exceeded === true ? true : ppob.exceeded === false ? false : null) : null,
    reasons,
    confirm,
    routes,
    options,
    applyWithin,
    approval,
    deadlineDays,
    steps,
    groups,
    docCount: groups.reduce((n, g) => n + g.rows.length, 0),
    checklistIsVoluntary: c.context === 'if_registering_voluntarily',
    beforeNotes: registering ? c.notes.filter((n) => KEY_NOTES.includes(n.id)).map((n) => n.text) : [],
    afterNotes: registering || a.verdict === 'VOLUNTARY_ELIGIBLE' ? afterRegistrationNotes(facts, asOf, rs) : [],
    nextSteps,
    lawDate: rs.meta.ruleset_date,
    rulesetVersion: rs.meta.ruleset_version,
    rulesetHash: rs.meta.ruleset_hash,
  };
}

export function lawDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Rules in force today (used to keep the UI on current law). */
export const lawInForce = (rec: { effective_from: string; effective_to: string | null }, today: string) => inForce(rec, today);
