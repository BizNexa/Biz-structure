// Knowledge-base smoke tests: every entity produces documents, compliances, registrations and an action plan
// from the public skeleton, and applicability rules respond to the user's answers.
const test = require("node:test"), assert = require("node:assert"), vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const ctx = { window: {}, console, AccessProvider: { isPremium: () => false } };
vm.createContext(ctx);
for (const f of ["js/engine.js", "js/kb-public.js", "js/kb.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx);
vm.runInContext("var ENTITIES = new Proxy({}, { get: (_, k) => ({ name: String(k) }) }); var engineInputs = a => a; var BizEngine = window.BizEngine;", ctx);
const KB = ctx.window.KB, ENT = ["sole", "partnership", "llp", "opc", "private_limited", "public_limited", "section8"];
const base = { objective: "profit", founders: "two_to_six", sector: "svc", state: "Maharashtra", supply: "s", turnover: "lt20", trade: "none", channels: ["n"], workforce: "none", contract: "n", premises: "home", plant: ["n"], din: "no", corp_owner: "no" };

for (const e of ENT) test(`${e}: every list is populated`, () => {
  assert.ok(KB.documents(e, base).docs.length > 5, "documents");
  assert.ok(KB.compliances(e, base).length > 10, "compliances");
  assert.ok(KB.registrations(e, base).some(r => r.id === "T01"), "PAN always applies");
  assert.ok(KB.actionPlan(e, base).length > 5, "action plan");
});

test("GST follows turnover, supply and channels", () => {
  const has = a => KB.registrations("private_limited", a).some(r => r.id === "G01" || r.id === "G02");
  assert.strictEqual(has(base), false);
  assert.strictEqual(has({ ...base, turnover: "40_150" }), true);
  assert.strictEqual(has({ ...base, channels: ["marketplace"] }), true);
  assert.strictEqual(has({ ...base, supply: "g", interstate: "y" }), true);
});

test("labour registrations follow headcount", () => {
  const ids = a => KB.registrations("llp", a).map(r => r.id);
  assert.ok(!ids(base).includes("L04"));
  assert.ok(ids({ ...base, workforce: "20_49" }).includes("L04"));
  assert.ok(ids({ ...base, workforce: "10_19", ec: "y" }).includes("L05"));
});

test("industry licences follow activities", () => {
  const ids = KB.registrations("private_limited", { ...base, sector: "food", activities: ["restaurant"], turnover: "40_150" }).map(r => r.id);
  assert.ok(ids.includes("I02"), "FSSAI state licence");
  assert.ok(!ids.includes("I09"), "no drug licence");
});

test("document triggers respond to answers", () => {
  const rent = KB.documents("private_limited", { ...base, premises: "rent" }).docs.length, home = KB.documents("private_limited", { ...base, premises: "own" }).docs.length;
  assert.ok(rent > home, "rented premises add NOC / rent documents");
});

test("public skeleton withholds details beyond the 35% core", () => {
  const all = KB.compliances("private_limited", base), withDetail = all.filter(r => r.detail).length;
  assert.ok(withDetail < all.length, "some rows are detail-free in the public file");
});
