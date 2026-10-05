const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');

const toolRoot = process.env.BIZ_TOOL_ROOT || path.join(process.env.TEMP, 'bizmatrix-tools');
const requireTool = createRequire(path.join(toolRoot, 'package.json'));
const acorn = requireTool('acorn');
const root = path.resolve(__dirname, '..');
const sourceFile = process.argv[2];

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

// Read only literal data and the registration-record constructor from the source.
function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => [p.key.name ?? p.key.value, literal(p.value)]));
  if (node.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node.type === 'CallExpression' && node.callee.name === 'R') {
    const [n, d, s, i, r, sec, x = '', add] = node.arguments.map(literal);
    return { n, d, s, i, r, sec, x: x.split(' '), add };
  }
  throw new Error(`Unexpected data expression: ${node.type}`);
}

async function main() {
  const { parse, serialize, parseFragment } = await import(pathToFileURL(requireTool.resolve('parse5')).href);
  const oldDocument = parse(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const document = parse(fs.readFileSync(sourceFile, 'utf8'));
  const elements = (tree, predicate) => {
    const found = [];
    function visit(n) { if (predicate(n)) found.push(n); (n.childNodes || []).forEach(visit); }
    visit(tree); return found;
  };
  const attr = (n, name) => n.attrs?.find(a => a.name === name)?.value;
  const setAttr = (n, name, value) => {
    const found = n.attrs.find(a => a.name === name);
    if (found) found.value = value; else n.attrs.push({ name, value });
  };
  const setText = (n, value) => { n.childNodes = [{ nodeName: '#text', value, parentNode: n }]; };
  const append = (n, html) => {
    const fragment = parseFragment(html);
    fragment.childNodes.forEach(child => { child.parentNode = n; n.childNodes.push(child); });
  };
  const scripts = elements(document, n => n.tagName === 'script');
  const vendor = scripts[0].childNodes.map(n => n.value || '').join('');
  let code = scripts[1].childNodes.map(n => n.value || '').join('');
  const ast = acorn.parse(code, { ecmaVersion: 'latest' });
  const declarations = new Map();
  const functions = new Map();
  walk(ast, n => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') declarations.set(n.id.name, n);
    if (n.type === 'FunctionDeclaration') functions.set(n.id.name, n);
  });
  const patches = [];
  const replace = (n, value) => patches.push({ start: n.start, end: n.end, value });
  const count = total => Math.floor(total * 35 / 100);
  const entities = literal(declarations.get('ENTITIES').init);
  for (const entity of Object.values(entities)) {
    entity.docsTotal = entity.docs.reduce((n, g) => n + g[1].length, 0);
    entity.compTotal = entity.comp.length;
    entity.compCounts = entity.comp.reduce((a, x) => ({ ...a, [x[0]]: (a[x[0]] || 0) + 1 }), {});
    let budget = count(entity.docsTotal);
    entity.docs = entity.docs.map(([name, items]) => {
      const visible = items.slice(0, budget); budget -= visible.length; return [name, visible];
    }).filter(g => g[1].length);
    const categories = [...new Set(entity.comp.map(x => x[0]))].map(category => {
      const records = entity.comp.filter(x => x[0] === category);
      const share = records.length * count(entity.compTotal) / entity.compTotal;
      return { records, count: Math.floor(share), remainder: share % 1 };
    });
    let extra = count(entity.compTotal) - categories.reduce((n, g) => n + g.count, 0);
    for (const group of [...categories].sort((a, b) => b.remainder - a.remainder)) {
      if (extra > 0) { group.count++; extra--; }
    }
    entity.comp = categories.flatMap(g => g.records.slice(0, g.count));
    delete entity.members; delete entity.audit; delete entity.tax;
  }
  replace(declarations.get('ENTITIES').init, JSON.stringify(entities, null, 2));
  const notes = literal(declarations.get('DOC_NOTES').init);
  const visibleDocs = new Set(Object.values(entities).flatMap(e => e.docs.flatMap(g => g[1])));
  replace(declarations.get('DOC_NOTES').init, JSON.stringify(Object.fromEntries(Object.entries(notes).filter(([name]) => visibleDocs.has(name))), null, 2));

  const groups = literal(declarations.get('G').init);
  const extraCalls = [];
  walk(ast, n => {
    let receiver = n.expression?.callee?.object;
    while (receiver?.type === 'MemberExpression') receiver = receiver.object;
    if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.type === 'MemberExpression' && n.expression.callee.property.name === 'push' && receiver?.name === 'G') {
      extraCalls.push(n); groups[groups.length - 1][1].push(...n.expression.arguments.map(literal));
    }
  });
  const totalRegistrations = groups.reduce((n, g) => n + g[1].length, 0);
  const registrationLimit = count(totalRegistrations);
  let registrationId = 0;
  for (const group of groups) {
    group[1] = group[1].map(record => {
      registrationId++;
      if (registrationId <= registrationLimit) return { ...record, preview: true };
      return { sec: record.sec, x: record.x, s: record.s, i: record.i, startup: /^Startup/.test(record.n), preview: false };
    });
  }
  replace(declarations.get('G').init, JSON.stringify(groups, null, 2));
  extraCalls.forEach(n => replace(n, ''));
  for (const name of ['P', 'D2', 'S2', 'VS', 'SR']) {
    const data = literal(declarations.get(name).init);
    replace(declarations.get(name).init, JSON.stringify(Object.fromEntries(Object.entries(data).filter(([id]) => Number(id) <= registrationLimit)), null, 2));
  }
  walk(ast, n => {
    if (n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' && n.expression.callee.type === 'MemberExpression' && n.expression.callee.object.name === 'Object' && n.expression.callee.property.name === 'assign') replace(n, '');
  });
  for (const name of ['PV', 'DEV', 'CHK', 'SRC', 'E', 'ST']) {
    const declaration = declarations.get(name);
    if (declaration) replace(declaration.init, '[]');
  }
  const renderers = ['metricCards', 'renderDashboard', 'renderAnalysis', 'renderDocs', 'updateDocs', 'renderCompliance', 'renderRegs', 'renderMatrix', 'renderAction', 'coreAction', 'buildPrint', 'renderConflict'];
  renderers.forEach(name => replace(functions.get(name), ''));
  const registrationCode = fs.readFileSync(path.join(__dirname, 'registration-preview.js'), 'utf8');
  replace(functions.get('render'), registrationCode);
  replace(functions.get('printHtml'), 'function printHtml(){return registrationPrintHtml(regPreview(true))}');
  replace(functions.get('actionText'), 'function actionText(){return "Review the registration preview."}');
  const snap = functions.get('snap');
  replace(snap, code.slice(snap.start, snap.end).replace('nx=m.find(x=>!done[x.i])', 'nx=regPreview(true).visibleItems.find(x=>x.v===2&&!done[x.i])').replace('nx?nx.r.n:"All mandatory items obtained"', 'nx?nx.r.n:AccessProvider.isPremium()?"All mandatory items obtained":"Full report required"'));
  patches.sort((a, b) => b.start - a.start);
  for (const patch of patches) code = code.slice(0, patch.start) + patch.value + code.slice(patch.end);
  code = code.replace('/^Startup/.test(r.n)', '(r.startup||/^Startup/.test(r.n||""))');
  code = code.replace('return{render,snap,lu,printHtml,actionText,reset()', 'return{render,snap,lu,printHtml,actionText,getPreview:regPreview,hydrate:hydrateRegistrations,resetContent:resetRegistrationContent,reset()');
  code = code.replace('a.download="Business_Structure_and_Registration_Report.pdf"', 'a.download=AccessProvider.isPremium()?"Biz_Matrix_Full_Report.pdf":"Biz_Matrix_35_Percent_Preview.pdf"');
  acorn.parse(code, { ecmaVersion: 'latest' });

  for (const script of scripts) script.parentNode.childNodes = script.parentNode.childNodes.filter(n => n !== script);
  const style = elements(document, n => n.tagName === 'style')[0];
  const css = style.childNodes.map(n => n.value || '').join('');
  style.parentNode.childNodes = style.parentNode.childNodes.filter(n => n !== style);
  const head = elements(document, n => n.tagName === 'head')[0];
  setText(elements(document, n => n.tagName === 'title')[0], 'Biz Matrix | Business Structure & Registration Intelligence');
  setAttr(elements(document, n => n.tagName === 'meta' && attr(n, 'name') === 'description')[0], 'content', 'Biz Matrix business structure and registration intelligence for India, FY 2026-27. Free 35% report preview.');
  append(head, '<meta name="robots" content="index,follow"><link rel="canonical" href="https://bizmatrix.in/"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="css/app.css"><link rel="stylesheet" href="css/preview.css"><link rel="stylesheet" href="css/payments.css">');
  const footers = elements(oldDocument, n => n.tagName === 'footer' && attr(n, 'class') === 'site-footer');
  for (const [id, footer] of [['assessment', footers[0]], ['dashboard', footers[1]]]) {
    const target = elements(document, n => attr(n, 'id') === id)[0];
    const location = id === 'assessment' ? target : elements(target, n => attr(n, 'class') === 'content')[0];
    location.childNodes.push(footer); footer.parentNode = location;
  }
  setText(elements(document, n => attr(n, 'class') === 'assess-mark')[0], 'BM');
  setText(elements(document, n => n.tagName === 'h1')[0], 'Biz Matrix');
  append(elements(document, n => attr(n, 'class') === 'assess-top')[0], '<p class="assess-intro">Business Structure &amp; Registration Intelligence · FY 2026–27</p><span class="preview-badge">35% Free Preview</span>');
  setText(elements(document, n => attr(n, 'class') === 'brand-title')[0], 'Biz Matrix');
  setText(elements(document, n => attr(n, 'id') === 'printBtn')[0], 'Download Preview PDF');
  setAttr(elements(document, n => attr(n, 'id') === 'menuBtn')[0], 'aria-label', 'Open navigation');
  setAttr(elements(document, n => attr(n, 'id') === 'menuBtn')[0], 'aria-expanded', 'false');
  const topbar = elements(document, n => attr(n, 'class') === 'topbar')[0];
  const banner = parseFragment('<div class="preview-status"><span class="preview-badge" id="accessBadge">35% Free Preview</span><div class="purchase-actions"><button class="btn" type="button" data-restore>Restore Access</button><button class="btn primary" type="button" data-buy>Unlock for &#8377;49</button><button class="btn hidden" type="button" data-receipt>Purchase Receipt</button></div></div>').childNodes[0];
  banner.parentNode = topbar.parentNode;
  topbar.parentNode.childNodes.splice(topbar.parentNode.childNodes.indexOf(topbar) + 1, 0, banner);
  append(elements(document, n => attr(n, 'id') === 'panel-comparison')[0], '<div id="matrixGate"></div>');
  const body = elements(document, n => n.tagName === 'body')[0];
  append(body, '<script src="js/config.js"></script><script src="js/pdf.min.js"></script><script src="js/preview.js"></script><script src="js/app.js"></script><script src="js/payments.js"></script>');
  fs.mkdirSync(path.join(root, 'css'), { recursive: true });
  fs.writeFileSync(path.join(root, 'css/app.css'), css);
  fs.writeFileSync(path.join(root, 'js/pdf.min.js'), vendor);
  fs.writeFileSync(path.join(root, 'js/app.js'), code);
  fs.writeFileSync(path.join(root, 'index.html'), serialize(document).replace(/[ \t]+$/gm, ''));
  console.log(JSON.stringify({ questions: 19, totalRegistrations, registrationLimit, entities: Object.fromEntries(Object.entries(entities).map(([key, e]) => [key, { docs: e.docs.flatMap(g => g[1]).length, docsTotal: e.docsTotal, compliance: e.comp.length, compTotal: e.compTotal }])) }, null, 2));
}
module.exports = { walk, literal };
if (require.main === module) {
  if (!sourceFile) throw new Error('Pass the commercial HTML source path.');
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
