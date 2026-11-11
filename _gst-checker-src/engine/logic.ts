/**
 * Three-valued (Kleene) evaluation of rule conditions.
 * A fact that is missing or answered "I don't know" evaluates to UNKNOWN, which propagates:
 *   false AND unknown = false, true AND unknown = unknown, true OR unknown = true, NOT unknown = unknown.
 */
import type { Condition } from '../rules/schema';
import { UNKNOWN, type Facts, type FactValue } from './facts';

export type TV = true | false | typeof UNKNOWN;

export interface EvalContext {
  facts: Facts;
  params: Record<string, number>;
}

const isUnknown = (v: FactValue) => v === undefined || v === null || v === UNKNOWN;

export function evalCondition(c: Condition, ctx: EvalContext): TV {
  if ('all' in c) {
    let sawUnknown = false;
    for (const x of c.all) {
      const r = evalCondition(x, ctx);
      if (r === false) return false;
      if (r === UNKNOWN) sawUnknown = true;
    }
    return sawUnknown ? UNKNOWN : true;
  }
  if ('any' in c) {
    let sawUnknown = false;
    for (const x of c.any) {
      const r = evalCondition(x, ctx);
      if (r === true) return true;
      if (r === UNKNOWN) sawUnknown = true;
    }
    return sawUnknown ? UNKNOWN : false;
  }
  if ('not' in c) {
    const r = evalCondition(c.not, ctx);
    return r === UNKNOWN ? UNKNOWN : !r;
  }

  const v = (ctx.facts as Record<string, FactValue>)[c.fact];
  if (isUnknown(v)) return UNKNOWN;

  if ('equals' in c) return v === c.equals;
  if ('in' in c) return (c.in as unknown[]).includes(v);
  if ('includes_any' in c) return Array.isArray(v) && v.some((x) => c.includes_any.includes(x));
  if (typeof v !== 'number') return UNKNOWN;
  if ('gt' in c) return v > c.gt;
  if ('gte' in c) return v >= c.gte;
  if ('lt' in c) return v < c.lt;
  if ('lte' in c) return v <= c.lte;
  if ('lte_param' in c) {
    const p = ctx.params[c.lte_param];
    return p === undefined ? UNKNOWN : v <= p;
  }
  if ('gt_param' in c) {
    const p = ctx.params[c.gt_param];
    return p === undefined ? UNKNOWN : v > p;
  }
  return UNKNOWN;
}

/** Facts referenced by a condition (used to explain which answer is missing). */
export function factsIn(c: Condition | undefined, out = new Set<string>()): Set<string> {
  if (!c) return out;
  if ('all' in c) c.all.forEach((x) => factsIn(x, out));
  else if ('any' in c) c.any.forEach((x) => factsIn(x, out));
  else if ('not' in c) factsIn(c.not, out);
  else out.add(c.fact);
  return out;
}

export function tvLabel(v: TV): 'yes' | 'no' | 'unknown' {
  return v === true ? 'yes' : v === false ? 'no' : 'unknown';
}
