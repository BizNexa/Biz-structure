// Writes tests/CASES_REVIEW.md: every hand-worked case with its arithmetic, for the CA to tick.
import fs from 'node:fs';
import path from 'node:path';
import { rupees, toRupees } from '../src/engine/index.ts';
import { cases } from '../tests/cases.ts';
import { loadRules, root } from '../tests/helpers.ts';

const R = loadRules();
const inr = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
const out: string[] = [];
let mismatches = 0;

out.push(`# CASES_REVIEW — hand-worked test cases, Tax Year 2026-27

**Every expected figure below is UNVERIFIED — CA to confirm.** They are the assistant's own computations, written as explicit
arithmetic in \`tests/cases.ts\` and worked independently of the engine. A match between "Expected" and "Engine" shows only that the
engine does what the assistant understood the rules to be; it does not show the rules are right.

${cases.length} cases. Tick (\`☐\` → \`☑\`) each one you agree with; write the correct figure against any you do not.
Rules version: ${R.meta.title}. Rules status: ${R.meta.status}

Notes for reading the figures
- Total income and tax payable are rounded to the nearest Rs. 10 (s.516), so a threshold "± Re. 1" case rounds onto the threshold. Each boundary is therefore tested at −10, −1, exact, +1 and +10 where relevant.
- Cases that rest on an assumption still awaiting your ruling name it (Z-05, Z-06, Z-07, Z-14, Z-15).
`);

let group = '';
for (const c of cases) {
  if (c.group !== group) {
    group = c.group;
    out.push(`\n## ${group}\n\n| ✔ | ID | Case | Working | Expected (Rs.) | Engine (Rs.) | Match |\n|---|---|---|---|---:|---:|---|`);
  }
  let engine: string; let match: string;
  try {
    const a = c.actual(R);
    engine = inr(toRupees(a));
    const ok = a === rupees(c.expected);
    if (!ok) mismatches++;
    match = ok ? 'yes' : '**NO**';
  } catch (e) {
    mismatches++; engine = `error: ${(e as Error).message}`; match = '**NO**';
  }
  out.push(`| ☐ | ${c.id} | ${c.title} | ${c.working} | ${inr(toRupees(rupees(c.expected)))} | ${engine} | ${match} |`);
}

fs.writeFileSync(path.join(root, 'tests', 'CASES_REVIEW.md'), out.join('\n') + '\n');
console.log(`CASES_REVIEW.md written: ${cases.length} cases, ${mismatches} mismatches`);
if (mismatches > 0) process.exit(1);
