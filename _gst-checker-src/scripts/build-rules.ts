/**
 * Validates rules/*.yaml and compiles them to engine/generated/ruleset.json, stamping the
 * rule-set version and a SHA-256 hash of the content (used in exports and the audit trail).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadRuleSet, hashRuleSet, ROOT } from './lib/load-rules';
import { lintRuleSet } from './lib/lint';

const { ruleset, schemaErrors } = loadRuleSet();
if (schemaErrors.length) {
  console.error('✗ build-rules: schema errors\n' + schemaErrors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
const { errors } = lintRuleSet(ruleset!);
if (errors.length) {
  console.error('✗ build-rules: lint errors (run npm run rules:lint)\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
const hash = hashRuleSet(ruleset!);
const out = { ...ruleset!, meta: { ...ruleset!.meta, ruleset_hash: hash } };
const dir = join(ROOT, 'engine', 'generated');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'ruleset.json'), JSON.stringify(out, null, 1));
console.log(`✓ Built rule set ${ruleset!.meta.ruleset_version} (${hash.slice(0, 12)}) → engine/generated/ruleset.json`);
