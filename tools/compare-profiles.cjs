// Runs the representative profiles through the assessment exactly as the question flow would:
// only questions the flow shows are answered; skipped questions fall back to their documented defaults.
// Usage: node tools/compare-profiles.cjs [out.json]
const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const R = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
function load() {
  const ctx = { window: {}, console, document: { getElementById: () => ({ onclick: null, onchange: null, addEventListener() {} }), querySelectorAll: () => [], addEventListener() {} }, AccessProvider: { isPremium: () => false } };
  vm.createContext(ctx);
  vm.runInContext(R("js/engine.js"), ctx); vm.runInContext(R("js/kb-public.js"), ctx); vm.runInContext(R("js/kb.js"), ctx);
  // pull QUESTIONS/REGQ and the scoring adapter out of app.js without running the UI
  const app = R("js/app.js");
  const q = app.slice(app.indexOf("const QUESTIONS=["), app.indexOf("const ALLQ="));
  const s = app.slice(app.indexOf("/* ---- Decision engine adapter"), app.indexOf("function optionLabel("));
  vm.runInContext("var BizEngine=window.BizEngine,KB=window.KB,state={answers:{}},ENTITIES=new Proxy({},{get:(_,k)=>({name:String(k)})});\n" + q + "\nvar ALLQ=QUESTIONS.concat(REGQ);\n" + s + "\nthis.QUESTIONS=QUESTIONS;this.REGQ=REGQ;this.ALLQ=ALLQ;this.qSkipped=qSkipped;this.engineInputs=engineInputs;this.score=score;", ctx);
  return ctx;
}
function run(ctx, facts) {
  // walk the flow: answer each visible question from the facts, in order
  const a = {};
  ctx.state.answers = a;
  let asked = 0;
  for (const q of ctx.ALLQ) {
    if (ctx.qSkipped(q, a)) continue;
    asked++;
    if (q.id === "practice") a.practice = facts.profession !== "none" ? facts.profession : facts.activity !== "none" ? facts.activity : "none";
    else if (q.id === "channels") a.channels = [...(facts.channels || []).filter(x => x !== "n"), ...(facts.trade === "import" || facts.trade === "both" ? ["import"] : []), ...(facts.trade === "export" || facts.trade === "both" ? ["export"] : [])];
    else a[q.id] = facts[q.id];
    if (q.id === "channels" && !a.channels.length) a.channels = ["n"];
  }
  const sc = ctx.score(a), r = sc.__engine, key = r.verdict === "NONE" ? null : ctx.BizEngine.APP_KEY[r.verdict];
  const out = { asked, verdict: r.verdict, score: r.ranking && r.ranking[0] ? r.ranking[0][1] : null, runner: r.runner_up || null, assumptions: typeof ctx.assumptions === "function" ? ctx.assumptions(a).map(x => x.id) : [] };
  if (key) { const s = ctx.KB.summary(key, a); Object.assign(out, { regs: s.regsMandatory + s.regsTriggered, docs: s.docs, compInitial: s.compInitial, compAnnual: s.compAnnual }); }
  return out;
}
const ctx = load(), profiles = require("./profiles.cjs");
const res = profiles.map(([name, facts]) => ({ name, ...run(ctx, facts) }));
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
console.table(res.map(r => ({ profile: r.name.slice(0, 34), asked: r.asked, verdict: r.verdict, score: r.score, runner: r.runner, regs: r.regs, docs: r.docs, "1st-yr": r.compInitial, recurring: r.compAnnual })));
