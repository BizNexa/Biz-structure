import type { Facts } from '../engine/facts';
import { assess, buildChecklist, deriveFacts, computeThresholds, evalCondition, RULESET, inForce, paramsAt } from '../engine';

/**
 * Baseline facts: what the questionnaire records for a small local goods trader who answered
 * "none of these" on every screening question. Scenarios override only what differs.
 */
export const BASE: Facts = {
  constitution: 'proprietorship',
  ppob_state: 'MH',
  other_supply_states: [],
  supply_nature: 'goods_only',
  taxability: 'some_taxable',
  special_goods_10_2019: false,
  aggregate_turnover_lakh: 25,
  interstate_taxable_supply: false,
  makes_exports: false,
  handicraft_only_with_conditions: false,
  job_worker_interstate_to_registered: false,
  supplies_via_eco: false,
  is_eco_operator: false,
  rcm_liable_inward: false,
  outward_all_rcm_by_recipient: false,
  supplies_metal_scrap: false,
  agent_on_behalf: false,
  is_isd: false,
  casual_occasional_no_fixed_place: false,
  non_resident_occasional: false,
  oidar_from_outside_to_nonregistered: false,
  online_money_gaming_from_outside: false,
  tds_category: 'none',
  sez_unit_or_developer: false,
  business_transferee_going_concern: false,
  amalgamation_transferee: false,
  agriculturist_own_produce_only: false,
  existing_registrations_same_pan: 'none',
  premises_type: 'owned',
  aadhaar_exempt_class: false,
  wants_voluntary: false,
  wants_rule_14a: false,
  wants_rule_14b: false,
};

export const AS_OF = '2026-11-07';

export const f = (over: Facts): Facts => ({ ...BASE, ...over });

export function run(over: Facts, asOf = AS_OF) {
  const facts = f(over);
  const a = assess(facts, asOf);
  return { facts, a, checklist: buildChecklist(facts, a) };
}

/** Does rule `id` evaluate to true for these facts on this date (including in-force check)? */
export function ruleResult(id: string, facts: Facts, asOf = AS_OF) {
  const rule = RULESET.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`no rule ${id}`);
  if (!inForce(rule, asOf)) return 'not_in_force' as const;
  const thr = computeThresholds(RULESET, facts, asOf);
  const ctx = { facts: { ...facts, ...deriveFacts(RULESET, facts, asOf, thr) }, params: paramsAt(RULESET, asOf) };
  return evalCondition(rule.applies_if, ctx);
}
