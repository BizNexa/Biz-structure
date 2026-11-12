// Fails if any engine file contains a numeric literal greater than 100.
// Statutory values must come from rules/ty2026-27.json, never from code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const LIMIT = 100;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'engine');
const problems = [];
let files = 0;

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
  files++;
  const file = path.join(dir, name);
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  const visit = (node) => {
    if (ts.isNumericLiteral(node) || ts.isBigIntLiteral(node)) {
      const value = Number(node.text.replace(/n$/, '').replace(/_/g, ''));
      if (Math.abs(value) > LIMIT) {
        const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart());
        problems.push(`${name}:${line + 1}:${character + 1}  numeric literal ${node.text}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

if (problems.length) {
  console.error(`Numeric literals above ${LIMIT} found in engine files:\n` + problems.join('\n'));
  process.exit(1);
}
console.log(`lint-literals: ${files} engine files, no numeric literal above ${LIMIT}`);
