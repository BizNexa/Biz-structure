import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { RULE_FILES, RuleSetSchema, type RuleSet } from '../../rules/schema';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const RULES_DIR = join(ROOT, 'rules');

/** Reads every rules/*.yaml file and returns the raw (unvalidated) object. */
export function loadRawRuleSet(dir = RULES_DIR): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [key, file] of Object.entries(RULE_FILES)) {
    const doc = parse(readFileSync(join(dir, file), 'utf8'), { merge: true }) as Record<string, unknown>;
    if (!doc || !(key in doc)) throw new Error(`${file}: missing top-level key "${key}"`);
    raw[key] = doc[key];
  }
  return raw;
}

export interface LoadResult {
  ruleset?: RuleSet;
  schemaErrors: string[];
}

export function loadRuleSet(dir = RULES_DIR): LoadResult {
  const raw = loadRawRuleSet(dir);
  const parsed = RuleSetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      schemaErrors: parsed.error.issues.map((i) => `${RULE_FILES[i.path[0] as keyof RuleSet] ?? i.path[0]} › ${describePath(raw, i.path)}: ${i.message}`),
    };
  }
  return { ruleset: parsed.data, schemaErrors: [] };
}

function describePath(raw: Record<string, unknown>, path: (string | number)[]): string {
  // Show the record id instead of an array index where possible.
  const [top, idx, ...rest] = path;
  const list = raw[top as string];
  if (Array.isArray(list) && typeof idx === 'number') {
    const rec = list[idx] as { id?: string } | undefined;
    return [rec?.id ?? `#${idx}`, ...rest].join('.');
  }
  return path.join('.');
}

export function hashRuleSet(rs: RuleSet): string {
  return createHash('sha256').update(JSON.stringify(rs)).digest('hex');
}
