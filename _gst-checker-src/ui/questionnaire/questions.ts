/**
 * Short adaptive questionnaire. A typical business answers about 7 questions; follow-ups appear only
 * when an earlier answer makes them decisive. Every hidden question contributes safe default facts,
 * so the engine never reads an unasked gate as "I don't know".
 *
 * Route preferences (Rule 14A / 14B) are no longer asked: the result page shows them as options the
 * user may qualify for.
 */
import { RULESET, UNKNOWN, inForce, type Assessment, type FactName, type Facts, type StateCode } from '../../engine';

export type Kind = 'cards' | 'state' | 'states' | 'flags' | 'yesno';
export type Step = 'business' | 'sales' | 'situations' | 'premises';

export interface CardOpt {
  id: string;
  icon: string;
  facts: Facts;
  more?: boolean; // shown under "More options"
}
export interface Flag {
  id: string;
  icon: string;
  facts: Facts; // applied when ticked
  more?: boolean; // shown under "More situations"
  /** The plain "none" answer, shown first; ticking it clears the others. */
  exclusive?: boolean;
}

export interface FlowCtx {
  asOf: string;
  /** Raw answers so far (for UI-only choices such as "I have a branch"). */
  ticked: (questionId: string, flagId: string) => boolean;
  provisional: () => Assessment;
}

export interface QuestionDef {
  id: string;
  kind: Kind;
  step: Step;
  /** Facts this question sets; all become UNKNOWN on "I don't know". */
  touches: FactName[];
  options?: CardOpt[];
  flags?: Flag[];
  /** For flags: facts when nothing is ticked (defaults false). */
  none?: Facts;
  yes?: (f: Facts) => Facts;
  no?: (f: Facts) => Facts;
  showIf?: (f: Facts, ctx: FlowCtx) => boolean;
  hidden?: (f: Facts) => Facts;
  /** Rules the question feeds (used for the help line). */
  rules: string[];
}

export const TURNOVER_BANDS = { upto10: 5, '10to20': 15, '20to40': 30, above40: 50 } as const;

/** Goods-only limit in force for a State (Rs lakh), from the rule data. */
export function goodsLimitFor(state: unknown, asOf: string): number | null {
  const st = RULESET.states.find((s) => s.code === (state as StateCode) && inForce(s, asOf));
  const thr = st && RULESET.thresholds.find((t) => t.threshold_category === st.threshold_category && inForce(t, asOf));
  return thr ? thr.goods_only_lakh : null;
}

const sells = (f: Facts) => f.supply_nature !== 'no_outward_supplies' && f.taxability !== 'exclusively_exempt_nontaxable';
const goodsish = (f: Facts) => f.supply_nature === 'goods_only' || f.supply_nature === 'goods_and_services';
const turnover = (f: Facts) => (typeof f.aggregate_turnover_lakh === 'number' ? f.aggregate_turnover_lakh : null);

const SALES_FALSE: Facts = { interstate_taxable_supply: false, makes_exports: false, supplies_via_eco: false, other_supply_states: [] };
const SITUATIONS_FALSE: Facts = {
  is_eco_operator: false,
  rcm_liable_inward: false,
  outward_all_rcm_by_recipient: false,
  supplies_metal_scrap: false,
  agent_on_behalf: false,
  is_isd: false,
  sez_unit_or_developer: false,
  business_transferee_going_concern: false,
  amalgamation_transferee: false,
  agriculturist_own_produce_only: false,
  casual_occasional_no_fixed_place: false,
  non_resident_occasional: false,
  oidar_from_outside_to_nonregistered: false,
  online_money_gaming_from_outside: false,
  tds_category: 'none',
};
const ROUTE_DEFAULTS: Facts = { wants_voluntary: false, wants_rule_14a: false, wants_rule_14b: false };

export const QUESTIONS: QuestionDef[] = [
  // ------------------------------------------------------------------ Business
  {
    id: 'business_type',
    kind: 'cards',
    step: 'business',
    touches: ['constitution'],
    rules: [],
    options: [
      { id: 'proprietorship', icon: 'user', facts: { constitution: 'proprietorship', aadhaar_exempt_class: false } },
      { id: 'partnership', icon: 'users', facts: { constitution: 'partnership', aadhaar_exempt_class: false } },
      { id: 'llp', icon: 'shield', facts: { constitution: 'llp', aadhaar_exempt_class: false } },
      { id: 'private_company', icon: 'building', facts: { constitution: 'private_company', aadhaar_exempt_class: false } },
      { id: 'opc', icon: 'badge', facts: { constitution: 'opc', aadhaar_exempt_class: false } },
      { id: 'public_company', icon: 'landmark', facts: { constitution: 'public_company', aadhaar_exempt_class: false } },
      { id: 'huf', icon: 'home', facts: { constitution: 'huf', aadhaar_exempt_class: false } },
    ],
  },
  { id: 'state', kind: 'state', step: 'business', touches: ['ppob_state'], rules: ['S22-1-THRESHOLD'] },

  // ------------------------------------------------------------------ Sales
  {
    id: 'supply',
    kind: 'cards',
    step: 'sales',
    touches: ['supply_nature', 'taxability'],
    rules: ['S22-1-THRESHOLD', 'EX-S23-1A-EXEMPT-ONLY'],
    options: [
      { id: 'goods', icon: 'box', facts: { supply_nature: 'goods_only', taxability: 'some_taxable' } },
      { id: 'services', icon: 'briefcase', facts: { supply_nature: 'services_only', taxability: 'some_taxable' } },
      { id: 'both', icon: 'layers', facts: { supply_nature: 'goods_and_services', taxability: 'some_taxable', goods_plus_interest_only: false } },
      { id: 'exempt_only', icon: 'leaf', facts: { supply_nature: 'goods_and_services', taxability: 'exclusively_exempt_nontaxable' } },
      { id: 'nothing', icon: 'cart', facts: { supply_nature: 'no_outward_supplies' } },
    ],
  },
  {
    id: 'turnover',
    kind: 'cards',
    step: 'sales',
    touches: ['aggregate_turnover_lakh'],
    rules: ['S22-1-THRESHOLD'],
    showIf: sells,
    options: [
      { id: 'upto10', icon: 'bar1', facts: { aggregate_turnover_lakh: TURNOVER_BANDS.upto10 } },
      { id: '10to20', icon: 'bar2', facts: { aggregate_turnover_lakh: TURNOVER_BANDS['10to20'] } },
      { id: '20to40', icon: 'bar3', facts: { aggregate_turnover_lakh: TURNOVER_BANDS['20to40'] } },
      { id: 'above40', icon: 'bar4', facts: { aggregate_turnover_lakh: TURNOVER_BANDS.above40 } },
    ],
  },
  {
    // Only decisive when a goods seller sits between Rs 20 and 40 lakh in a State with the Rs 40 lakh limit.
    id: 'special_goods',
    kind: 'yesno',
    step: 'sales',
    touches: ['special_goods_10_2019'],
    rules: ['EX-N10-2019-CT-GOODS-40L'],
    yes: () => ({ special_goods_10_2019: true }),
    no: () => ({ special_goods_10_2019: false }),
    showIf: (f, c) => f.supply_nature === 'goods_only' && turnover(f) === TURNOVER_BANDS['20to40'] && goodsLimitFor(f.ppob_state, c.asOf) === 40,
    hidden: () => ({ special_goods_10_2019: false }),
  },
  {
    id: 'interest_only',
    kind: 'yesno',
    step: 'sales',
    touches: ['goods_plus_interest_only'],
    rules: ['EX-N10-2019-CT-GOODS-40L'],
    yes: () => ({ goods_plus_interest_only: true }),
    no: () => ({ goods_plus_interest_only: false }),
    showIf: (f, c) =>
      f.supply_nature === 'goods_and_services' && f.taxability === 'some_taxable' && turnover(f) === TURNOVER_BANDS['20to40'] && goodsLimitFor(f.ppob_state, c.asOf) === 40,
  },
  {
    id: 'where_sell',
    kind: 'flags',
    step: 'sales',
    touches: ['interstate_taxable_supply', 'makes_exports', 'supplies_via_eco'],
    rules: ['S24-I-INTERSTATE', 'S24-IX-ECO-SUPPLIER', 'S24-X-TCS'],
    showIf: sells,
    hidden: () => SALES_FALSE,
    none: SALES_FALSE,
    flags: [
      { id: 'local_only', icon: 'home', facts: {}, exclusive: true },
      { id: 'other_states', icon: 'truck', facts: { interstate_taxable_supply: true } },
      { id: 'export', icon: 'plane', facts: { interstate_taxable_supply: true, makes_exports: true } },
      { id: 'marketplace', icon: 'store', facts: { supplies_via_eco: true } },
      { id: 'branch', icon: 'map', facts: {} },
    ],
  },
  { id: 'branch_states', kind: 'states', step: 'sales', touches: ['other_supply_states'], rules: ['S22-1-THRESHOLD'], showIf: (_f, c) => c.ticked("where_sell", "branch"), hidden: () => ({ other_supply_states: [] }) },
  {
    id: 'eco_9_5',
    kind: 'yesno',
    step: 'sales',
    touches: ['eco_supplies_only_9_5_services'],
    rules: ['S24-IX-ECO-SUPPLIER'],
    yes: () => ({ eco_supplies_only_9_5_services: true }),
    no: () => ({ eco_supplies_only_9_5_services: false }),
    showIf: (f) => f.supplies_via_eco === true && f.supply_nature === 'services_only',
    hidden: (f) => (f.supplies_via_eco === true ? { eco_supplies_only_9_5_services: false } : {}),
  },
  {
    id: 'eco_small_seller',
    kind: 'yesno',
    step: 'sales',
    touches: ['eco_goods_conditions_34_2023', 'preceding_fy_turnover_lakh'],
    rules: ['EX-N34-2023-CT-ECO-GOODS'],
    yes: (f) => ({ eco_goods_conditions_34_2023: true, preceding_fy_turnover_lakh: turnover(f) ?? UNKNOWN }),
    no: () => ({ eco_goods_conditions_34_2023: false }),
    showIf: (f) => f.supplies_via_eco === true && goodsish(f) && f.interstate_taxable_supply !== true && (turnover(f) ?? 99) <= TURNOVER_BANDS['20to40'],
    hidden: () => ({ eco_goods_conditions_34_2023: false }),
  },
  {
    id: 'other_state_reg',
    kind: 'yesno',
    step: 'sales',
    touches: ['existing_registrations_same_pan'],
    rules: ['ROUTE-RULE-14B'],
    yes: () => ({ existing_registrations_same_pan: 'other_states' }),
    no: () => ({ existing_registrations_same_pan: 'none' }),
    showIf: (f) => f.supplies_via_eco === true,
    hidden: () => ({ existing_registrations_same_pan: 'none' }),
  },

  // ------------------------------------------------------------------ Situations
  {
    id: 'situations',
    kind: 'flags',
    step: 'situations',
    touches: Object.keys(SITUATIONS_FALSE) as FactName[],
    rules: ['S24-III-RCM', 'S24-VII-AGENT', 'S24-II-CASUAL', 'S24-VIII-ISD', 'S24-VI-TDS'],
    none: SITUATIONS_FALSE,
    flags: [
      { id: 'none', icon: 'check', facts: {}, exclusive: true },
      { id: 'rcm_inward', icon: 'refresh', facts: { rcm_liable_inward: true } },
      { id: 'agent', icon: 'handshake', facts: { agent_on_behalf: true } },
      { id: 'casual', icon: 'tent', facts: { casual_occasional_no_fixed_place: true } },
      { id: 'isd', icon: 'share', facts: { is_isd: true } },
      { id: 'sez', icon: 'factory', facts: { sez_unit_or_developer: true } },
      { id: 'tds', icon: 'gov', facts: { tds_category: UNKNOWN } },
      { id: 'all_outward_rcm', icon: 'scale', facts: { outward_all_rcm_by_recipient: true }, more: true },
      { id: 'metal_scrap', icon: 'recycle', facts: { supplies_metal_scrap: true }, more: true },
      { id: 'transferee', icon: 'key', facts: { business_transferee_going_concern: true }, more: true },
      { id: 'amalgamation', icon: 'merge', facts: { amalgamation_transferee: true }, more: true },
      { id: 'agriculturist', icon: 'leaf', facts: { agriculturist_own_produce_only: true }, more: true },
      { id: 'platform', icon: 'monitor', facts: { is_eco_operator: true }, more: true },
      { id: 'nrtp', icon: 'passport', facts: { non_resident_occasional: true }, more: true },
      { id: 'oidar', icon: 'cloud', facts: { oidar_from_outside_to_nonregistered: true }, more: true },
      { id: 'omg', icon: 'dice', facts: { online_money_gaming_from_outside: true }, more: true },
    ],
  },
  {
    id: 'platform_role',
    kind: 'flags',
    step: 'situations',
    touches: ['eco_collects_tcs', 'eco_liable_9_5'],
    rules: ['S24-X-TCS', 'S24-IV-ECO-9-5'],
    showIf: (f) => f.is_eco_operator === true,
    none: { eco_collects_tcs: false, eco_liable_9_5: false },
    flags: [
      { id: 'neither', icon: 'dots', facts: {}, exclusive: true },
      { id: 'collects_tcs', icon: 'wallet', facts: { eco_collects_tcs: true } },
      { id: 'pays_9_5', icon: 'car', facts: { eco_liable_9_5: true } },
    ],
  },
  {
    id: 'tds_type',
    kind: 'cards',
    step: 'situations',
    touches: ['tds_category'],
    rules: ['S24-VI-TDS', 'S24-VI-TDS-METAL-SCRAP', 'S24-VI-TDS-NEW-SCRAP'],
    showIf: (_f, c) => c.ticked("situations", "tds"),
    options: [
      { id: 'psu', icon: 'building', facts: { tds_category: 'psu' } },
      { id: 'agency', icon: 'badge', facts: { tds_category: 'governmental_agency' } },
      { id: 'metal', icon: 'recycle', facts: { tds_category: 'metal_scrap_recipient' } },
      { id: 'new_scrap', icon: 'recycle', facts: { tds_category: 'new_scrap_recipient' } },
    ],
  },
  {
    id: 'agent_invoice',
    kind: 'yesno',
    step: 'situations',
    touches: ['agent_invoices_in_own_name', 'principal_is_taxable_person'],
    rules: ['S24-VII-AGENT'],
    // The principal is almost always a registered business; a farmer principal is the handbook exception.
    yes: () => ({ agent_invoices_in_own_name: true, principal_is_taxable_person: true }),
    no: () => ({ agent_invoices_in_own_name: false, principal_is_taxable_person: true }),
    showIf: (f) => f.agent_on_behalf === true,
  },
  {
    id: 'casual_long',
    kind: 'yesno',
    step: 'situations',
    touches: ['casual_long_exhibition_over_180'],
    rules: ['S24-II-LONG-EXHIBITION'],
    yes: () => ({ casual_long_exhibition_over_180: true }),
    no: () => ({ casual_long_exhibition_over_180: false }),
    showIf: (f) => f.casual_occasional_no_fixed_place === true,
  },
  {
    id: 'small_interstate',
    kind: 'flags',
    step: 'situations',
    touches: ['handicraft_only_with_conditions', 'job_worker_interstate_to_registered'],
    rules: ['EX-N3-2018-IT-HANDICRAFT', 'EX-N7-2017-IT-JOB-WORKER'],
    // Only decisive for small businesses whose inter-State or event sales would otherwise force registration.
    showIf: (f) => (f.interstate_taxable_supply === true && f.makes_exports !== true || f.casual_occasional_no_fixed_place === true) && (turnover(f) ?? 99) <= TURNOVER_BANDS['20to40'] && goodsish(f),
    hidden: () => ({ handicraft_only_with_conditions: false, job_worker_interstate_to_registered: false }),
    none: { handicraft_only_with_conditions: false, job_worker_interstate_to_registered: false },
    flags: [
      { id: 'neither', icon: 'dots', facts: {}, exclusive: true },
      { id: 'handicraft', icon: 'brush', facts: { handicraft_only_with_conditions: true } },
      { id: 'job_worker', icon: 'tool', facts: { job_worker_interstate_to_registered: true } },
    ],
  },

  // ------------------------------------------------------------------ Premises (only if registering)
  {
    id: 'premises',
    kind: 'cards',
    step: 'premises',
    touches: ['premises_type'],
    rules: ['DOC-PPOB-OWNED'],
    showIf: (f, c) => {
      if (f.non_resident_occasional === true || f.oidar_from_outside_to_nonregistered === true || f.online_money_gaming_from_outside === true) return false;
      const p = c.provisional();
      if (p.verdict !== 'MANDATORY' && p.verdict !== 'NEEDS_CA_REVIEW') return false;
      // Premises proof belongs to REG-01; REG-07/09/10 applicants are not asked.
      return p.recommended_route_ids.some((id) => p.routes.find((r) => r.id === id)?.form.startsWith('REG-01'));
    },
    options: [
      { id: 'owned', icon: 'home', facts: { premises_type: 'owned' } },
      { id: 'rented_registered_agreement', icon: 'doc', facts: { premises_type: 'rented_registered_agreement' } },
      { id: 'rented_unregistered_agreement', icon: 'doc', facts: { premises_type: 'rented_unregistered_agreement' } },
      { id: 'rented_no_agreement', icon: 'doc', facts: { premises_type: 'rented_no_agreement' }, more: true },
      { id: 'consent_relative', icon: 'users', facts: { premises_type: 'consent_relative' } },
      { id: 'shared_with_agreement', icon: 'grid', facts: { premises_type: 'shared_with_agreement' } },
      { id: 'shared_without_agreement', icon: 'grid', facts: { premises_type: 'shared_without_agreement' }, more: true },
      { id: 'co_working', icon: 'monitor', facts: { premises_type: 'co_working' } },
      { id: 'sez_premises', icon: 'factory', facts: { premises_type: 'sez_premises' }, more: true },
      { id: 'deceased_ancestor', icon: 'key', facts: { premises_type: 'deceased_ancestor' }, more: true },
      { id: 'other', icon: 'dots', facts: { premises_type: 'other' }, more: true },
    ],
  },
];

export const STEPS: Step[] = ['business', 'sales', 'situations', 'premises'];
export { ROUTE_DEFAULTS, SITUATIONS_FALSE, SALES_FALSE };
