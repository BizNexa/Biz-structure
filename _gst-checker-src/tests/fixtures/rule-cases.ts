/**
 * Per-rule cases: every liability rule has at least one case where it fires (true) and one where it
 * does not (false). Used by tests/rules.test.ts and by scripts/rule-coverage-report.ts.
 */
import type { Facts } from '../../engine/facts';

export interface RuleCase {
  rule: string;
  fires: boolean;
  facts: Facts; // overrides on BASE
  asOf?: string;
  note?: string;
}

export const RULE_CASES: RuleCase[] = [
  // s.22
  { rule: 'S22-1-THRESHOLD', fires: true, facts: { supply_nature: 'services_only', aggregate_turnover_lakh: 21 } },
  { rule: 'S22-1-THRESHOLD', fires: false, facts: { supply_nature: 'services_only', aggregate_turnover_lakh: 20 }, note: 'limit must be exceeded, not reached' },
  { rule: 'S22-1-THRESHOLD', fires: true, facts: { aggregate_turnover_lakh: 41 } },
  { rule: 'S22-1-THRESHOLD', fires: false, facts: { aggregate_turnover_lakh: 39 } },
  { rule: 'S22-1-THRESHOLD', fires: false, facts: { aggregate_turnover_lakh: 90, taxability: 'exclusively_exempt_nontaxable' } },
  { rule: 'S22-3-TRANSFER', fires: true, facts: { business_transferee_going_concern: true } },
  { rule: 'S22-3-TRANSFER', fires: false, facts: {} },
  { rule: 'S22-4-AMALGAMATION', fires: true, facts: { amalgamation_transferee: true, constitution: 'private_company' } },
  { rule: 'S22-4-AMALGAMATION', fires: false, facts: {} },
  // s.24
  { rule: 'S24-I-INTERSTATE', fires: true, facts: { interstate_taxable_supply: true } },
  { rule: 'S24-I-INTERSTATE', fires: false, facts: { interstate_taxable_supply: true, taxability: 'exclusively_exempt_nontaxable' } },
  { rule: 'S24-II-CASUAL', fires: true, facts: { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false } },
  { rule: 'S24-II-CASUAL', fires: false, facts: { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: true } },
  { rule: 'S24-II-LONG-EXHIBITION', fires: true, facts: { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: true } },
  { rule: 'S24-II-LONG-EXHIBITION', fires: false, facts: { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false } },
  { rule: 'S24-III-RCM', fires: true, facts: { rcm_liable_inward: true } },
  { rule: 'S24-III-RCM', fires: false, facts: {} },
  { rule: 'S24-IV-ECO-9-5', fires: true, facts: { is_eco_operator: true, eco_liable_9_5: true, eco_collects_tcs: false } },
  { rule: 'S24-IV-ECO-9-5', fires: false, facts: { is_eco_operator: true, eco_liable_9_5: false, eco_collects_tcs: true } },
  { rule: 'S24-V-NRTP', fires: true, facts: { non_resident_occasional: true, constitution: 'foreign_entity' } },
  { rule: 'S24-V-NRTP', fires: false, facts: {} },
  { rule: 'S24-VI-TDS', fires: true, facts: { tds_category: 'govt_department', constitution: 'government_local_authority' } },
  { rule: 'S24-VI-TDS', fires: false, facts: { tds_category: 'metal_scrap_recipient' } },
  { rule: 'S24-VI-TDS-METAL-SCRAP', fires: true, facts: { tds_category: 'metal_scrap_recipient' } },
  { rule: 'S24-VI-TDS-METAL-SCRAP', fires: false, facts: { tds_category: 'none' } },
  { rule: 'S24-VI-TDS-NEW-SCRAP', fires: true, facts: { tds_category: 'new_scrap_recipient' }, asOf: '2026-11-01' },
  { rule: 'S24-VI-TDS-NEW-SCRAP', fires: false, facts: { tds_category: 'metal_scrap_recipient' }, asOf: '2026-11-01' },
  { rule: 'S24-VII-AGENT', fires: true, facts: { agent_on_behalf: true, agent_invoices_in_own_name: true, principal_is_taxable_person: true } },
  { rule: 'S24-VII-AGENT', fires: false, facts: { agent_on_behalf: true, agent_invoices_in_own_name: false, principal_is_taxable_person: true }, note: 'Circular 57 scenario 1/2: facilitator only' },
  { rule: 'S24-VIII-ISD', fires: true, facts: { is_isd: true } },
  { rule: 'S24-VIII-ISD', fires: false, facts: {} },
  { rule: 'S24-IX-ECO-SUPPLIER', fires: true, facts: { supplies_via_eco: true, eco_supplies_only_9_5_services: false } },
  { rule: 'S24-IX-ECO-SUPPLIER', fires: false, facts: { supplies_via_eco: true, eco_supplies_only_9_5_services: true } },
  { rule: 'S24-X-TCS', fires: true, facts: { is_eco_operator: true, eco_collects_tcs: true, eco_liable_9_5: false } },
  { rule: 'S24-X-TCS', fires: false, facts: { is_eco_operator: false } },
  { rule: 'S24-XI-OIDAR', fires: true, facts: { oidar_from_outside_to_nonregistered: true } },
  { rule: 'S24-XI-OIDAR', fires: false, facts: {} },
  { rule: 'S24-XIA-OMG', fires: true, facts: { online_money_gaming_from_outside: true } },
  { rule: 'S24-XIA-OMG', fires: false, facts: {} },
  // s.23
  { rule: 'EX-S23-1A-EXEMPT-ONLY', fires: true, facts: { taxability: 'exclusively_exempt_nontaxable' } },
  { rule: 'EX-S23-1A-EXEMPT-ONLY', fires: false, facts: { taxability: 'some_taxable' }, note: 'nil-rated counts as some_taxable' },
  { rule: 'EX-S23-1B-AGRICULTURIST', fires: true, facts: { agriculturist_own_produce_only: true, constitution: 'huf' } },
  { rule: 'EX-S23-1B-AGRICULTURIST', fires: false, facts: { agriculturist_own_produce_only: true, constitution: 'private_company' }, note: 'only individual or HUF' },
  { rule: 'EX-N5-2017-RCM-ONLY', fires: true, facts: { outward_all_rcm_by_recipient: true, supplies_metal_scrap: true }, asOf: '2024-06-01', note: 'before the metal-scrap carve-out' },
  { rule: 'EX-N5-2017-RCM-ONLY', fires: false, facts: { outward_all_rcm_by_recipient: false }, asOf: '2024-06-01' },
  { rule: 'EX-N5-2017-RCM-ONLY-2024', fires: true, facts: { outward_all_rcm_by_recipient: true } },
  { rule: 'EX-N5-2017-RCM-ONLY-2024', fires: false, facts: { outward_all_rcm_by_recipient: true, supplies_metal_scrap: true } },
  { rule: 'EX-N10-2017-IT-INTERSTATE-SERVICES', fires: true, facts: { supply_nature: 'services_only', interstate_taxable_supply: true, aggregate_turnover_lakh: 15 } },
  { rule: 'EX-N10-2017-IT-INTERSTATE-SERVICES', fires: false, facts: { supply_nature: 'services_only', interstate_taxable_supply: true, aggregate_turnover_lakh: 22 } },
  { rule: 'EX-N10-2017-IT-SERVICES-EXPORTER', fires: true, facts: { supply_nature: 'services_only', interstate_taxable_supply: true, makes_exports: true, aggregate_turnover_lakh: 15 } },
  { rule: 'EX-N10-2017-IT-SERVICES-EXPORTER', fires: false, facts: { supply_nature: 'services_only', interstate_taxable_supply: true, makes_exports: false, aggregate_turnover_lakh: 15 } },
  { rule: 'EX-N3-2018-IT-HANDICRAFT', fires: true, facts: { interstate_taxable_supply: true, handicraft_only_with_conditions: true, aggregate_turnover_lakh: 12 } },
  { rule: 'EX-N3-2018-IT-HANDICRAFT', fires: false, facts: { interstate_taxable_supply: true, handicraft_only_with_conditions: false } },
  { rule: 'EX-N56-2018-CT-HANDICRAFT-CASUAL', fires: true, facts: { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false, handicraft_only_with_conditions: true, aggregate_turnover_lakh: 8 } },
  { rule: 'EX-N56-2018-CT-HANDICRAFT-CASUAL', fires: false, facts: { casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false, handicraft_only_with_conditions: true, aggregate_turnover_lakh: 50 } },
  { rule: 'EX-N7-2017-IT-JOB-WORKER', fires: true, facts: { interstate_taxable_supply: true, job_worker_interstate_to_registered: true, supply_nature: 'services_only' } },
  { rule: 'EX-N7-2017-IT-JOB-WORKER', fires: false, facts: { interstate_taxable_supply: true } },
  { rule: 'EX-N65-2017-CT-ECO-SERVICES', fires: true, facts: { supply_nature: 'services_only', supplies_via_eco: true, eco_supplies_only_9_5_services: false, aggregate_turnover_lakh: 12 } },
  { rule: 'EX-N65-2017-CT-ECO-SERVICES', fires: false, facts: { supply_nature: 'goods_only', supplies_via_eco: true, eco_supplies_only_9_5_services: false, aggregate_turnover_lakh: 12 } },
  { rule: 'EX-N34-2023-CT-ECO-GOODS', fires: true, facts: { supplies_via_eco: true, eco_supplies_only_9_5_services: false, eco_goods_conditions_34_2023: true, aggregate_turnover_lakh: 30, preceding_fy_turnover_lakh: 28 } },
  { rule: 'EX-N34-2023-CT-ECO-GOODS', fires: false, facts: { supplies_via_eco: true, eco_supplies_only_9_5_services: false, eco_goods_conditions_34_2023: true, aggregate_turnover_lakh: 30, preceding_fy_turnover_lakh: 45 } },
  { rule: 'EX-ECO-MIXED-GOODS-SERVICES', fires: true, facts: { supply_nature: 'goods_and_services', goods_plus_interest_only: false, supplies_via_eco: true, eco_supplies_only_9_5_services: false, eco_goods_conditions_34_2023: true, aggregate_turnover_lakh: 12, preceding_fy_turnover_lakh: 10 } },
  { rule: 'EX-ECO-MIXED-GOODS-SERVICES', fires: false, facts: { supply_nature: 'goods_and_services', goods_plus_interest_only: false, supplies_via_eco: true, eco_supplies_only_9_5_services: false, eco_goods_conditions_34_2023: false, aggregate_turnover_lakh: 12, preceding_fy_turnover_lakh: 10 } },
  { rule: 'EX-N10-2019-CT-GOODS-40L', fires: true, facts: { supply_nature: 'goods_only', special_goods_10_2019: false } },
  { rule: 'EX-N10-2019-CT-GOODS-40L', fires: false, facts: { supply_nature: 'goods_only', special_goods_10_2019: true } },
  // voluntary
  { rule: 'VOL-S25-3', fires: true, facts: { wants_voluntary: true } },
  { rule: 'VOL-S25-3', fires: false, facts: { wants_voluntary: false } },
];
