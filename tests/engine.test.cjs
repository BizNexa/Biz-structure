// Regression suite from BizMatrix Knowledge Base v1.0 (D7): run on every deployment; block release on any failure.
const test = require("node:test");
const assert = require("node:assert");
const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/engine.js"), "utf8"), ctx);
const E = ctx.window.BizEngine;
const DATA = require("./bizmatrix_rules_v1.0.json");

for (const tc of DATA.test_cases) {
  test(`${tc.id} ${tc.title}`, () => {
    const r = E.evaluate(tc.inputs);
    assert.strictEqual(r.verdict, tc.expected, `verdict; ranking=${JSON.stringify(r.ranking)}`);
    if (tc.runner_up) assert.strictEqual(r.runner_up, tc.runner_up, `runner-up; ranking=${JSON.stringify(r.ranking)}`);
  });
}

test("tax table matches the published rulebook (C2)", () => {
  for (const [k, row] of Object.entries(DATA.tax_table))
    for (const [e, v] of Object.entries(row)) assert.ok(Math.abs(E.TAX[k][e].tax - v.tax) <= 1, `${k} ${e}: ${E.TAX[k][e].tax} vs ${v.tax}`);
});

test("score tables match the published rulebook (D3)", () => {
  for (const [f, opts] of Object.entries(DATA.scores)) {
    if (f === "cost") { assert.deepStrictEqual(E.SCORES.cost, E.FORPROFIT.map(e => opts[e])); continue; }
    for (const [o, row] of Object.entries(opts)) assert.deepStrictEqual(E.SCORES[f][o], E.FORPROFIT.map(e => row[e]), `${f}.${o}`);
  }
  assert.strictEqual(E.FACTORS.reduce((s, f) => s + f.weight, 0), 100);
});

test("every rule id in the rulebook is implemented", () => {
  for (const r of DATA.rules) assert.ok(E.RULES[r.id], r.id);
});
