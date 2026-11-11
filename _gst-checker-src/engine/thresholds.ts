/**
 * s.22(1) threshold computation. Produces per-State limits and the derived facts
 * turnover_within_base_threshold, turnover_within_applicable_threshold and
 * preceding_turnover_within_applicable_threshold, with a trace of the records used.
 */
import { UNKNOWN, type Facts, type StateCode } from './facts';
import { evalCondition, type TV } from './logic';
import { inForce, type CompiledRuleSet } from './ruleset';

export const GOODS_LIMIT_RULE_ID = 'EX-N10-2019-CT-GOODS-40L';
export const INTEREST_CONFLICT_ID = 'C-006';

export interface StateThreshold {
  code: string;
  name: string;
  category: string;
  threshold_record_id: string | null;
  base_limit_lakh: number | null;
  /** The limit used for the s.22(1) test, or null when it cannot be decided. */
  applicable_limit_lakh: number | null;
  limit_basis: string;
  exceeded: TV;
}

export interface ThresholdResult {
  states: StateThreshold[];
  turnover_within_base_threshold: TV;
  turnover_within_applicable_threshold: TV;
  preceding_turnover_within_applicable_threshold: TV;
  goods_limit_applies: TV;
  interest_ambiguity: boolean;
  trace: string[];
}

export function supplyStates(facts: Facts): string[] | null {
  const ppob = facts.ppob_state;
  if (typeof ppob !== 'string' || ppob === UNKNOWN) return null;
  const others = Array.isArray(facts.other_supply_states) ? (facts.other_supply_states as string[]) : [];
  return [ppob, ...others.filter((s) => s !== ppob)];
}

export function computeThresholds(rs: CompiledRuleSet, facts: Facts, asOf: string): ThresholdResult {
  const trace: string[] = [];
  const goodsRule = rs.rules.find((r) => r.id === GOODS_LIMIT_RULE_ID && inForce(r, asOf));
  let goodsLimit: TV = goodsRule ? evalCondition(goodsRule.applies_if, { facts, params: {} }) : false;
  // Goods + exempt interest only: the handbook reports two schools of thought (conflict C-006).
  const interestCase = facts.supply_nature === 'goods_and_services' && facts.goods_plus_interest_only === true && facts.special_goods_10_2019 !== true;
  if (goodsRule) trace.push(`${GOODS_LIMIT_RULE_ID}: ${interestCase ? 'goods + exempt interest only -> both limits considered (C-006)' : `goods-only limit applies = ${goodsLimit}`}`);

  const states = supplyStates(facts);
  if (!states) {
    trace.push('ppob_state unknown -> thresholds unknown');
    return {
      states: [],
      turnover_within_base_threshold: UNKNOWN,
      turnover_within_applicable_threshold: UNKNOWN,
      preceding_turnover_within_applicable_threshold: UNKNOWN,
      goods_limit_applies: goodsLimit,
      interest_ambiguity: false,
      trace,
    };
  }

  const turnover = typeof facts.aggregate_turnover_lakh === 'number' ? facts.aggregate_turnover_lakh : null;
  const preceding = typeof facts.preceding_fy_turnover_lakh === 'number' ? facts.preceding_fy_turnover_lakh : null;
  let interestAmbiguity = false;

  const rows: StateThreshold[] = states.map((code) => {
    const st = rs.states.find((s) => s.code === (code as StateCode) && inForce(s, asOf));
    const thr = st ? rs.thresholds.find((t) => t.threshold_category === st.threshold_category && inForce(t, asOf)) : undefined;
    if (!st || !thr) {
      trace.push(`${code}: no state/threshold record in force on ${asOf}`);
      return { code, name: code, category: '?', threshold_record_id: null, base_limit_lakh: null, applicable_limit_lakh: null, limit_basis: 'No record in force', exceeded: UNKNOWN };
    }
    const base = thr.services_or_mixed_lakh;
    const goods = thr.goods_only_lakh;
    let applicable: number | null;
    let basis: string;
    let exceeded: TV;
    if (interestCase && goods !== base) {
      // Decide only if both readings agree.
      if (turnover === null) {
        applicable = null;
        exceeded = UNKNOWN;
      } else if (turnover > goods) {
        applicable = goods;
        exceeded = true;
      } else if (turnover <= base) {
        applicable = base;
        exceeded = false;
      } else {
        applicable = null;
        exceeded = UNKNOWN;
        interestAmbiguity = true;
      }
      basis = `Rs ${base} lakh or Rs ${goods} lakh depending on whether exempt interest income disqualifies the Rs 40 lakh goods limit (conflict C-006)`;
    } else if (goodsLimit === true) {
      applicable = goods;
      basis = goods === base ? `Rs ${base} lakh (goods limit not enhanced in this State)` : `Rs ${goods} lakh - exclusive supply of goods (${thr.goods_only_basis})`;
      exceeded = turnover === null ? UNKNOWN : turnover > applicable;
    } else if (goodsLimit === false) {
      applicable = base;
      basis = `Rs ${base} lakh - ${thr.legal_basis}`;
      exceeded = turnover === null ? UNKNOWN : turnover > applicable;
    } else {
      // Goods-limit eligibility unknown: decide only where both limits give the same answer.
      applicable = goods === base ? base : null;
      basis = goods === base ? `Rs ${base} lakh` : `Rs ${base} lakh or Rs ${goods} lakh (depends on unanswered questions about goods supplied)`;
      if (turnover === null) exceeded = UNKNOWN;
      else if (turnover > Math.max(base, goods)) exceeded = true;
      else if (turnover <= Math.min(base, goods)) exceeded = false;
      else exceeded = UNKNOWN;
    }
    trace.push(`${code} (${st.threshold_category}) via ${thr.id}: limit ${applicable ?? '?'} lakh, turnover ${turnover ?? '?'} -> exceeded ${exceeded}`);
    return { code, name: st.name, category: st.threshold_category, threshold_record_id: thr.id, base_limit_lakh: base, applicable_limit_lakh: applicable, limit_basis: basis, exceeded };
  });

  const within = (vals: TV[]): TV => (vals.some((v) => v === true) ? false : vals.some((v) => v === UNKNOWN) ? UNKNOWN : true);
  const baseWithin = within(rows.map((r) => (turnover === null || r.base_limit_lakh === null ? UNKNOWN : turnover > r.base_limit_lakh)));
  const applicableWithin = within(rows.map((r) => r.exceeded));
  const precedingWithin = within(
    rows.map((r) => {
      if (preceding === null) return UNKNOWN;
      if (r.applicable_limit_lakh !== null) return preceding > r.applicable_limit_lakh;
      if (r.base_limit_lakh !== null && preceding <= r.base_limit_lakh) return false;
      return UNKNOWN;
    }),
  );
  if (interestCase && goodsRule) goodsLimit = UNKNOWN;

  return {
    states: rows,
    turnover_within_base_threshold: baseWithin,
    turnover_within_applicable_threshold: applicableWithin,
    preceding_turnover_within_applicable_threshold: precedingWithin,
    goods_limit_applies: goodsLimit,
    interest_ambiguity: interestAmbiguity,
    trace,
  };
}
