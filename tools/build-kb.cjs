#!/usr/bin/env node
/* Build the BizMatrix knowledge base from the source reference files.
   Inputs (kept outside the public repo):
     --checklist  bizmatrix_master_checklist.json        (Master Registration Checklist v1.0)
     --regmap     regmap.json      (tables parsed from Registration_Master_Map_FY2026-27.pdf)
     --compliance compliance.json  (tables parsed from Compliance_Master_India.pdf)
   Outputs:
     saas-backend/private/catalog.json  FULL data, uploaded to the Worker (never committed; gitignored)
     js/kb-public.js                     public skeleton: names, applicability keys, and details for the
                                         core 35% of each list only. Paid users receive the rest from the Worker.
   Usage: node tools/build-kb.cjs --checklist <file> --regmap <file> --compliance <file> */
"use strict";
const fs = require("fs"), path = require("path");
const arg = k => { const i = process.argv.indexOf("--" + k); if (i < 0) throw new Error("missing --" + k); return process.argv[i + 1]; };
const CHK = JSON.parse(fs.readFileSync(arg("checklist"), "utf8"));
const REG = JSON.parse(fs.readFileSync(arg("regmap"), "utf8"));
const CMP = JSON.parse(fs.readFileSync(arg("compliance"), "utf8"));
const ROOT = path.join(__dirname, "..");
const ENT = ["sole", "partnership", "llp", "opc", "private_limited", "public_limited", "section8"];
const CODE_ORDER = ["sole", "partnership", "llp", "private_limited", "public_limited", "section8", "opc"]; // SP PF LLP PVT PUB S8 OPC
const SHARE = 0.35;
const clean = s => String(s || "").replace(/Law stated as of 6 November 2026\.?\s*(\[C\] confirmed)?\s*/g, "").replace(/\s*·?\s*\[V\] verify before filing\.?\s*Preliminary guidance, not legal advice\.?\s*\d*/g, "").replace(/\s+/g, " ").replace(/Rs(?=\d)/g, "₹").trim();

/* ---------------- 1. Document checklist (per entity) ---------------- */
function docCond(t) {
  t = (t || "").toLowerCase();
  if (!t) return "";
  if (/director has no din|not required if .*din/.test(t)) return "noDin";
  if (/already holds a din/.test(t)) return "hasDin";
  if (/foreign national|foreign subscriber|non-resident|nri without pan|partner is a foreign|director is a foreign/.test(t)) return "foreignFounder";
  if (/foreign capital|foreign subscriber invests/.test(t)) return "foreignInvestment";
  if (/foreign contribution|donation expected/.test(t)) return "foreignContribution";
  if (/body corporate|company or llp is a partner|company, llp or foreign|company or non-resident wants|owned by a company, llp or firm/.test(t)) return "corporateOwner";
  if (/rented|not owned|premises not owned/.test(t)) return "rentedPremises";
  if (/maharashtra, karnataka or west bengal/.test(t)) return "agileState";
  if (/levies pt/.test(t)) return "ptState";
  if (/turnover above threshold|gst or iec|opts for gstin/.test(t)) return "gst";
  if (/imports or exports/.test(t)) return "trade";
  if (/>7 subscribers|more than 7 subscribers/.test(t)) return "sevenPlus";
  if (/≤7 subscribers/.test(t)) return "upToSeven";
  if (/shop, office or commercial|commercial premises/.test(t)) return "commercialPremises";
  if (/indian national/.test(t)) return "indianFounder";
  if (/msme status/.test(t)) return "";
  return "check"; // shown with the trigger text so the user can confirm
}
const checklist = {};
for (const e of CHK.entities) {
  const docs = e.documents.map(d => ({
    id: d.id, step: d.step, cat: clean(d.category), name: clean(d.name), who: clean(d.provider_role),
    mandatory: !!d.mandatory, trigger: clean(d.trigger), cond: docCond(d.trigger), tag: d.tag,
    detail: { validity: clean(d.validity_rules), form: clean(d.attaches_to_form), source: clean(d.legal_source), notes: clean(d.notes) }
  }));
  checklist[e.entity] = { name: e.name, summary: e.summary, steps: e.steps.map(s => ({ id: s.id, stage: clean(s.stage), text: clean(s.description) })), docs };
}

/* ---------------- 2. Compliance (initial + annual, per entity) ---------------- */
function compCond(r) {
  const t = (r.compliance + " " + r.applicability + " " + r.form).toLowerCase();
  if (/fcra/.test(t)) return "foreignContribution";
  if (/importer-exporter|iec/.test(t)) return "trade";
  if (/fssai/.test(t)) return "food";
  if (/dpiit|startup india/.test(t)) return "startup";
  if (/transfer pricing|legal entity identifier|lei|statement of financial transactions|sft|internal audit|ind as|mat certificate/.test(t)) return "large";
  if (/municipal trade|signage|fire noc/.test(t)) return "premises";
  if (/fc-gpr|fc-trs|\bfla\b|foreign liabilities|llp-i\b|fdi|downstream/.test(t)) return "foreignInvestment";
  if (/odi|overseas (direct )?investment|annual performance report/.test(t)) return "odi";
  if (/e-invoic|\birn\b/.test(t)) return "einvoice";
  if (/gstr-9c|reconciliation statement/.test(t)) return "gstLarge";
  if (/gst|gstr|e-way|composition|cmp-0|itc-0/.test(t)) return "gst";
  if (/\bepf\b|provident|ecr/.test(t)) return "epf";
  if (/esic|\besi\b/.test(t)) return "esic";
  if (/labour welfare|\blwf\b/.test(t)) return "lwf";
  if (/professional tax|ptec|ptrc|\bpt\b/.test(t)) return "pt";
  if (/contract labour|contractor/.test(t)) return "contract";
  if (/bonus|gratuity|osh|factory|maternity|posh|internal committee|standing orders|wage|payment of wages|minimum wage/.test(t)) return "employees";
  if (/tax audit|3ca|3cb|s\.63|section 63|44ab/.test(t)) return "taxAudit";
  if (/tds|tcs|\btan\b|deduct|24q|26q|27q|form 130|form 138|form 140/.test(t)) return "tds";
  if (/csr/.test(t)) return "csr";
  if (/msme-1|msme form/.test(t)) return "msmeDues";
  if (/shops|s&e|establishment/.test(t)) return "premises";
  if (/udyam/.test(t)) return "";
  if (/dpdp|personal data/.test(t)) return "personalData";
  if (/secretarial audit|mr-3|cost audit|independent director|audit committee|nomination|cfo|whole-time|company secretary|ksm|mgt-14/.test(t)) return "large";
  return "";
}
const compliance = {};
for (const k of ENT) compliance[k] = [];
for (const r of CMP) {
  if (!compliance[r.entity]) continue;
  const row = {
    id: r.entity.slice(0, 3) + "-" + (r.part === "initial" ? "I" : "A") + String(r.no).padStart(2, "0"),
    part: r.part, freq: clean(r.freq), title: clean(r.compliance), cond: compCond(r),
    detail: { law: clean(r.law), form: clean(r.form), authority: clean(r.authority), due: clean(r.due), applicability: clean(r.applicability), penalty: clean(r.penalty), source: clean(r.source), status: clean(r.status) }
  };
  compliance[r.entity].push(row);
}

/* ---------------- 3. Registrations (universal Part C + industry Part D) ---------------- */
const registrations = [];
for (const r of REG.partC) {
  const codes = {}, cs = (r["SP PF LLP PVT"] || "").trim().split(/\s+/);
  CODE_ORDER.forEach((e, i) => { codes[e] = cs[i] === "N" || cs[i] === "–" || !cs[i] ? "N" : cs[i]; });
  registrations.push({ id: r.ID, cat: clean(r.category), name: clean(r.Registration), codes, scope: "universal",
    detail: { statute: clean(r.Statute), trigger: clean(r["Trigger / threshold"]), authority: clean(r.Authority), portal: clean(r.Portal), timeline: clean(r.Timeline), tag: clean(r.Tag) } });
}
for (const r of REG.partD) {
  const codes = {}; CODE_ORDER.forEach(e => { codes[e] = "C"; });
  registrations.push({ id: r.ID, cat: clean(r.category), name: clean(r["Registration / licence"]), codes, scope: "industry",
    detail: { statute: clean(r.Statute), trigger: clean(r["Trigger / threshold"]), authority: clean(r.Authority), portal: clean(r.Portal), validity: clean(r.Validity), fee: clean(r["Approx. fee"]), penalty: clean(r.Penalty), tag: clean(r.Tag) } });
}

/* ---------------- outputs ---------------- */
const full = { version: 2, kbVersion: "1.0", verified: "6 Nov 2026", sources: ["BizMatrix Master Registration Checklist v1.0", "Registration Master Map FY 2026-27", "Initial & Annual Compliance Master (law as of 6 Nov 2026)"], checklist, compliance, registrations };
// legacy keys required by the Worker's catalog validation
const catalog = Object.assign({ entities: { private_limited: { docs: [], comp: [] } }, registrations: { groups: [] } }, { version: 1, kb: full });

const strip = (list) => { const n = Math.ceil(list.length * SHARE); return list.map((x, i) => i < n ? x : Object.assign({}, x, { detail: null })); };
const pub = { version: 2, kbVersion: "1.0", verified: full.verified, checklist: {}, compliance: {}, registrations: [] };
for (const k of ENT) {
  pub.checklist[k] = Object.assign({}, checklist[k], { docs: strip(checklist[k].docs) });
  pub.compliance[k] = strip(compliance[k]);
}
// registrations: core universal rows first, then industry; details for the first 35% of each scope
pub.registrations = strip(registrations.filter(r => r.scope === "universal")).concat(strip(registrations.filter(r => r.scope === "industry")));

fs.mkdirSync(path.join(ROOT, "saas-backend/private"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "saas-backend/private/catalog.json"), JSON.stringify(catalog));
fs.writeFileSync(path.join(ROOT, "js/kb-public.js"), "/* Generated by tools/build-kb.cjs. Public skeleton of the BizMatrix knowledge base: full detail for the core 35% of each list; paid reports load the rest. Do not edit by hand. */\nwindow.BIZ_KB=" + JSON.stringify(pub) + ";\n");
const cnt = o => Object.values(o).reduce((s, v) => s + (v.docs ? v.docs.length : v.length), 0);
console.log("documents", cnt(checklist), "compliance rows", cnt(compliance), "registrations", registrations.length);
console.log("private catalog", (fs.statSync(path.join(ROOT, "saas-backend/private/catalog.json")).size / 1024).toFixed(0) + " KB; public", (fs.statSync(path.join(ROOT, "js/kb-public.js")).size / 1024).toFixed(0) + " KB");
const unk = {}; Object.values(checklist).forEach(e => e.docs.filter(d => d.cond === "check").forEach(d => { unk[d.trigger] = 1; }));
console.log("doc triggers left as 'check':", Object.keys(unk).length);
