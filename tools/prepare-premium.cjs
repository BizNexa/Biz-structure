const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { walk, literal } = require('./import-commercial.cjs');
const requireTool = createRequire(path.join(process.env.BIZ_TOOL_ROOT || path.join(process.env.TEMP, 'bizmatrix-tools'), 'package.json'));
const acorn = requireTool('acorn');

async function main() {
  if (!process.argv[2]) throw new Error('Pass the complete commercial HTML source path.');
  const { parse } = await import(pathToFileURL(requireTool.resolve('parse5')).href);
  const document = parse(fs.readFileSync(process.argv[2], 'utf8'));
  const scripts = [];
  function visit(node) { if (node.tagName === 'script') scripts.push(node); (node.childNodes || []).forEach(visit); }
  visit(document);
  const code = scripts.find(node => node.childNodes.some(child => child.value?.includes('const ENTITIES=')))?.childNodes.map(n => n.value || '').join('');
  if (!code) throw new Error('Commercial report script not found.');
  const ast = acorn.parse(code, { ecmaVersion: 'latest' });
  const declarations = new Map();
  walk(ast, n => { if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') declarations.set(n.id.name, n); });
  const entities = literal(declarations.get('ENTITIES').init);
  for (const entity of Object.values(entities)) {
    entity.docsTotal = entity.docs.reduce((n, group) => n + group[1].length, 0);
    entity.compTotal = entity.comp.length;
  }
  const groups = literal(declarations.get('G').init);
  const provisions = literal(declarations.get('P').init);
  walk(ast, n => {
    let receiver = n.expression?.callee?.object;
    while (receiver?.type === 'MemberExpression') receiver = receiver.object;
    if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.property?.name === 'push' && receiver?.name === 'G') groups[groups.length - 1][1].push(...n.expression.arguments.map(literal));
    if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.object?.name === 'Object' && n.expression.callee.property?.name === 'assign' && n.expression.arguments[0]?.name === 'P') Object.assign(provisions, literal(n.expression.arguments[1]));
  });
  groups.forEach(([, records]) => records.forEach(record => { record.preview = true; }));
  const registrations = { groups, provisions };
  for (const [key, declaration] of Object.entries({ descriptions: 'D2', stateFlags: 'S2', verification: 'VS', sourceRefs: 'SR' })) registrations[key] = literal(declarations.get(declaration).init);
  const catalog = { version: 1, product: 'bizmatrix-full-report-fy2026-27', entities, docNotes: literal(declarations.get('DOC_NOTES').init), registrations };
  const directory = path.resolve(process.argv[3] || path.join(__dirname, '../saas-backend/private'));
  const publicRoot = path.resolve(__dirname, '..');
  if ((directory === publicRoot || directory.startsWith(publicRoot + path.sep)) && directory !== path.join(publicRoot, 'saas-backend', 'private')) throw new Error('Use the gitignored backend private directory or an external private path.');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'catalog.json'), JSON.stringify(catalog), { mode: 0o600 });
  console.log(`Prepared private full-report catalog: ${Object.keys(entities).length} structures and ${groups.reduce((n, g) => n + g[1].length, 0)} registrations.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
