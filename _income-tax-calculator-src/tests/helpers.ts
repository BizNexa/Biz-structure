import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRules, type RawRuleFile, type Rules } from '../src/engine/index.ts';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadRules(): Rules {
  return buildRules(JSON.parse(fs.readFileSync(path.join(root, 'rules', 'ty2026-27.json'), 'utf8')) as RawRuleFile);
}

/** Small deterministic random generator so property tests are repeatable. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
