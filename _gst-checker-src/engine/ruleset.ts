import type { RuleSet, BaseT } from '../rules/schema';
import data from './generated/ruleset.json';

export type CompiledRuleSet = RuleSet & { meta: RuleSet['meta'] & { ruleset_hash: string } };

/** The compiled rule set (run `npm run rules:build` after editing rules/*.yaml). */
export const RULESET = data as unknown as CompiledRuleSet;

/** Earliest as-of date the engine models. Earlier periods are not supported. */
export const MIN_AS_OF = '2024-01-01';

export function inForce(rec: Pick<BaseT, 'effective_from' | 'effective_to'>, asOf: string): boolean {
  return rec.effective_from <= asOf && (rec.effective_to === null || asOf <= rec.effective_to);
}

export function isPendingVerification(status: string): boolean {
  return status !== 'handbook' && status !== 'official';
}

export function paramsAt(rs: CompiledRuleSet, asOf: string): Record<string, number> {
  const p: Record<string, number> = {};
  for (const c of rs.config) if (inForce(c, asOf)) p[c.id] = c.value;
  return p;
}

export function todayISO(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
