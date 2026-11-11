/**
 * Fact registry. Every fact that a rule condition may reference is declared here,
 * with its type and allowed values. The rule linter rejects conditions that
 * reference an undeclared fact or an undeclared enum value.
 *
 * Facts describe the business only. No personal identifiers (PAN, Aadhaar, GSTIN,
 * names, addresses) are ever collected.
 *
 * The special value UNKNOWN represents an "I don't know" answer and is evaluated with
 * three-valued (Kleene) logic by the engine.
 */

export const UNKNOWN = 'unknown' as const;
export type Unknown = typeof UNKNOWN;

export type FactType = 'boolean' | 'enum' | 'number' | 'enum_multi';

export interface FactSpec {
  type: FactType;
  values?: readonly string[];
  /** Derived facts are computed by the engine, never asked. */
  derived?: boolean;
  description: string;
}

export const STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DH', 'DL', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA',
  'KL', 'LA', 'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TS',
  'TR', 'UP', 'UK', 'WB',
] as const;
export type StateCode = (typeof STATE_CODES)[number];

export const CONSTITUTIONS = [
  'proprietorship',
  'partnership',
  'llp',
  'private_company',
  'public_company',
  'opc',
  'huf',
  'trust',
  'society_club',
  'aop_boi',
  'government_local_authority',
  'foreign_entity',
  'others',
] as const;
export type Constitution = (typeof CONSTITUTIONS)[number];

export const PREMISES_TYPES = [
  'owned',
  'rented_registered_agreement',
  'rented_unregistered_agreement',
  'rented_no_agreement',
  'consent_relative',
  'shared_with_agreement',
  'shared_without_agreement',
  'co_working',
  'sez_premises',
  'deceased_ancestor',
  'other',
] as const;

export const TDS_CATEGORIES = [
  'none',
  'govt_department',
  'local_authority',
  'governmental_agency',
  'notified_authority_or_board',
  'govt_society',
  'psu',
  'metal_scrap_recipient',
  'new_scrap_recipient',
] as const;

export const FACTS = {
  // ---------- Who ----------
  constitution: { type: 'enum', values: CONSTITUTIONS, description: 'Constitution of business as per PAN / REG-01.' },
  ppob_state: { type: 'enum', values: STATE_CODES, description: 'State/UT of the principal place of business.' },
  other_supply_states: {
    type: 'enum_multi',
    values: STATE_CODES,
    description: 'Other States/UTs from which taxable supplies are made (same PAN).',
  },

  // ---------- What is supplied ----------
  supply_nature: {
    type: 'enum',
    values: ['goods_only', 'services_only', 'goods_and_services', 'no_outward_supplies'],
    description: 'Nature of outward supplies.',
  },
  goods_plus_interest_only: {
    type: 'boolean',
    description:
      'Supplies goods, and the only services are exempt deposits/loans/advances earning interest or discount (Explanation to s.22(1)).',
  },
  taxability: {
    type: 'enum',
    values: ['some_taxable', 'exclusively_exempt_nontaxable'],
    description:
      'some_taxable includes nil-rated and mixed taxable+exempt. exclusively_exempt_nontaxable = only wholly exempt or non-taxable supplies (not nil-rated).',
  },
  aggregate_turnover_lakh: { type: 'number', description: 'Aggregate turnover (s.2(6)) for the financial year, Rs lakh, all-India, PAN level.' },
  preceding_fy_turnover_lakh: { type: 'number', description: 'Aggregate turnover of the preceding financial year, Rs lakh.' },
  special_goods_10_2019: {
    type: 'boolean',
    description: 'Supplies ice cream/edible ice, pan masala, tobacco, fly-ash bricks/aggregates/blocks, bricks of fossil meals, building bricks, earthen/roofing tiles.',
  },

  // ---------- Inter-State ----------
  interstate_taxable_supply: { type: 'boolean', description: 'Makes any inter-State taxable supply (exports count as inter-State).' },
  makes_exports: { type: 'boolean', description: 'Some of the inter-State supplies are exports of goods or services.' },
  handicraft_only_with_conditions: {
    type: 'boolean',
    description: 'Inter-State supplies are only notified handicraft goods / hand-made products, and the person has PAN and generates e-way bills.',
  },
  job_worker_interstate_to_registered: {
    type: 'boolean',
    description: 'Inter-State supplies are only job-work services to registered persons.',
  },

  // ---------- E-commerce ----------
  supplies_via_eco: { type: 'boolean', description: 'Supplies goods or services through an e-commerce operator that collects TCS (s.52).' },
  eco_supplies_only_9_5_services: {
    type: 'boolean',
    description: 'Every supply made through the platform is a notified s.9(5) service on which the operator pays the tax.',
  },
  eco_goods_conditions_34_2023: {
    type: 'boolean',
    description: 'Goods via ECO are intra-State only, in one State only, with PAN, declared on the portal and an enrolment number obtained (Notification 34/2023-CT).',
  },
  is_eco_operator: { type: 'boolean', description: 'Owns, operates or manages a digital platform for electronic commerce.' },
  eco_collects_tcs: { type: 'boolean', description: 'As an operator, required to collect TCS under s.52.' },
  eco_liable_9_5: { type: 'boolean', description: 'As an operator, liable to pay tax under s.9(5) / IGST s.5(5).' },

  // ---------- Reverse charge, agents, ISD ----------
  rcm_liable_inward: { type: 'boolean', description: 'Liable to pay tax under reverse charge on inward supplies.' },
  outward_all_rcm_by_recipient: {
    type: 'boolean',
    description: 'All outward supplies are ones on which the recipient pays the whole tax under s.9(3) (Notification 5/2017-CT).',
  },
  supplies_metal_scrap: { type: 'boolean', description: 'Supplies metal scrap of Chapters 72 to 81 of the Customs Tariff.' },
  agent_on_behalf: { type: 'boolean', description: 'Makes or arranges supplies on behalf of a principal (agent, broker, commission agent, auctioneer, C&F).' },
  agent_invoices_in_own_name: { type: 'boolean', description: 'As agent, issues the invoice for the further supply in own name / can pass title.' },
  principal_is_taxable_person: { type: 'boolean', description: 'The principal is registered or liable to be registered (e.g. not an agriculturist).' },
  is_isd: { type: 'boolean', description: 'Office receiving input service invoices to distribute credit to distinct persons.' },

  // ---------- Special persons ----------
  casual_occasional_no_fixed_place: {
    type: 'boolean',
    description: 'Occasionally supplies in a State/UT where it has no fixed place of business.',
  },
  casual_long_exhibition_over_180: { type: 'boolean', description: 'The occasional activity (exhibition) runs more than 180 days.' },
  non_resident_occasional: {
    type: 'boolean',
    description: 'Occasionally supplies in India and has no fixed place of business or residence in India.',
  },
  oidar_from_outside_to_nonregistered: {
    type: 'boolean',
    description: 'Supplies OIDAR services from outside India to persons in India other than registered persons.',
  },
  online_money_gaming_from_outside: { type: 'boolean', description: 'Supplies online money gaming from outside India to persons in India.' },
  tds_category: { type: 'enum', values: TDS_CATEGORIES, description: 'Category under s.51 / Notification 50/2018-CT (as amended).' },
  sez_unit_or_developer: { type: 'boolean', description: 'Has an SEZ unit or is an SEZ developer.' },
  business_transferee_going_concern: {
    type: 'boolean',
    description: 'Is the transferee/successor of a business of a registered person transferred as a going concern (s.22(3)).',
  },
  amalgamation_transferee: {
    type: 'boolean',
    description: 'Is the transferee in an amalgamation/demerger sanctioned by a court, tribunal or other authority (s.22(4)).',
  },
  agriculturist_own_produce_only: {
    type: 'boolean',
    description: 'Individual or HUF supplying only produce out of cultivation of own land (s.2(7), s.23(1)(b)).',
  },

  // ---------- Existing registrations, premises, preferences ----------
  existing_registrations_same_pan: {
    type: 'enum',
    values: ['none', 'same_state', 'other_states', 'same_and_other_states'],
    description: 'Existing GST registrations under the same PAN.',
  },
  premises_type: { type: 'enum', values: PREMISES_TYPES, description: 'Possession of the principal place of business.' },
  wants_voluntary: { type: 'boolean', description: 'Wishes to register voluntarily (s.25(3)) if not otherwise liable.' },

  // ---------- Route facts ----------
  wants_rule_14a: { type: 'boolean', description: 'Wishes to opt for the Rule 14A simplified registration.' },
  monthly_output_tax_to_registered_lakh: {
    type: 'number',
    description: 'Expected monthly output tax liability (CGST+SGST/UTGST+IGST+cess) on supplies to registered persons, Rs lakh.',
  },
  aadhaar_authentication_willing: {
    type: 'boolean',
    description: 'Authorised signatory and at least one promoter/partner will complete Aadhaar authentication.',
  },
  aadhaar_exempt_class: {
    type: 'boolean',
    description: 'Non-citizen, government department, local authority, statutory body or PSU (Notification 3/2021-CT under s.25(6D)).',
  },
  existing_14a_same_state: { type: 'boolean', description: 'A Rule 14A registration is already filed or granted on the same PAN in the same State.' },
  wants_rule_14b: { type: 'boolean', description: 'Wishes to use the Rule 14B route for e-commerce supplies into another State.' },
  no_presence_in_target_state: {
    type: 'boolean',
    description: 'No physical presence and no active regular registration in the target State.',
  },
  target_state_supplies_only_via_eco: { type: 'boolean', description: 'In the target State, supplies will be made only through ECOs.' },

  // ---------- Derived (computed by the engine) ----------
  ppob_state_category: { type: 'enum', derived: true, values: ['SCS_EXPL', 'OTHER_SCS_A', 'OTHER_SCS_B', 'NON_SCS_EXCL', 'OTHER'], description: 'Threshold category of the PPOB State on the as-of date.' },
  has_regular_registration_other_state: { type: 'boolean', derived: true, description: 'Derived from existing_registrations_same_pan.' },
  turnover_within_base_threshold: {
    type: 'boolean',
    derived: true,
    description: 'Aggregate turnover does not exceed the s.22(1) base limit (Rs 20 lakh / Rs 10 lakh) for every supply State.',
  },
  turnover_within_applicable_threshold: {
    type: 'boolean',
    derived: true,
    description: 'Aggregate turnover does not exceed the limit above which the person is liable under s.22(1) (incl. Rs 40 lakh goods limit where it applies) in every supply State.',
  },
  preceding_turnover_within_applicable_threshold: {
    type: 'boolean',
    derived: true,
    description: 'Same test as above for the preceding financial year.',
  },
  normal_taxpayer_category: {
    type: 'boolean',
    derived: true,
    description: 'True unless the applicant is only an NRTP, OIDAR/OMG supplier, TDS deductor or TCS collector (these use REG-09/10/07).',
  },
} as const satisfies Record<string, FactSpec>;

export type FactName = keyof typeof FACTS;
export const FACT_NAMES = Object.keys(FACTS) as FactName[];

export type FactValue = boolean | number | string | string[] | Unknown | undefined;
export type Facts = Partial<Record<FactName, FactValue>>;

export function isKnown(v: FactValue): boolean {
  return v !== undefined && v !== UNKNOWN;
}
