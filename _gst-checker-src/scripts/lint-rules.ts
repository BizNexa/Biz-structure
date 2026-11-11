/** Fails (exit 1) if the rule set violates the schema or the semantic lint. */
import { loadRuleSet } from './lib/load-rules';
import { lintRuleSet } from './lib/lint';

const { ruleset, schemaErrors } = loadRuleSet();
if (schemaErrors.length) {
  console.error(`✗ Schema errors (${schemaErrors.length}):`);
  schemaErrors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
const { errors, warnings } = lintRuleSet(ruleset!);
warnings.forEach((w) => console.warn('  ! ' + w));
if (errors.length) {
  console.error(`✗ Lint errors (${errors.length}):`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✓ Rule set ${ruleset!.meta.ruleset_version} passes lint (${warnings.length} warnings).`);
