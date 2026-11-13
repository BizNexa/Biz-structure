/* BizMatrix decision engine v1.0 — JavaScript port of the reference implementation (engine.py).
   Source of truth: BizMatrix Knowledge Base & Decision Rulebook v1.0, law verified as of 6 Nov 2026.
   Order of operations (Part D): hard rules -> eligible set -> NONE / only-eligible / weighted scoring -> confidence -> REVIEW flags. */
(function (root) {
  "use strict";
  var VERSION = "1.0", VERIFIED = "6 Nov 2026", NEXT_REVIEW = "6 Feb 2027";
  var ENT = ["PROP", "PF", "LLP", "OPC", "PVT", "PUB", "S8"];
  var FORPROFIT = ["PROP", "PF", "LLP", "OPC", "PVT", "PUB"];
  var NAME = { PROP: "Sole Proprietorship", PF: "Partnership Firm", LLP: "Limited Liability Partnership", OPC: "One Person Company", PVT: "Private Limited Company", PUB: "Public Limited Company", S8: "Section 8 Company" };
  var APP_KEY = { PROP: "sole", PF: "partnership", LLP: "llp", OPC: "opc", PVT: "private_limited", PUB: "public_limited", S8: "section8" };

  /* ---------------- tax model (Income-tax Act 2025, tax year 2026-27) ---------------- */
  var CESS = 0.04;
  var SLABS = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
  function indivTax(inc) {
    if (inc <= 1200000) return 0;
    var t = 0, lo = 0;
    for (var i = 0; i < SLABS.length; i++) { var hi = SLABS[i][0], r = SLABS[i][1]; if (inc > lo) t += (Math.min(inc, hi) - lo) * r; lo = hi; }
    var sc = inc > 2e7 ? .25 : inc > 1e7 ? .15 : inc > 5e6 ? .10 : 0;
    return t * (1 + sc) * (1 + CESS);
  }
  function firmTax(p) { return p <= 0 ? 0 : p * .30 * (1 + (p > 1e7 ? .12 : 0)) * (1 + CESS); }
  function coTax(p) { return Math.max(p, 0) * .22 * 1.10 * 1.04; }
  function maxRemuneration(bp) { if (bp <= 0) return 300000; var first = Math.min(bp, 600000); return Math.max(300000, .9 * first) + .6 * Math.max(bp - 600000, 0); }
  function taxScenario(e, P, mode) {
    var n = (e === "PROP" || e === "OPC") ? 1 : 2;
    if (e === "PROP") return { tax: indivTax(P), note: "Proprietor taxed on full profit at slab rates (no entity-level tax)." };
    if (e === "PF" || e === "LLP") {
      var best = null;
      [0, Math.min(maxRemuneration(P), P)].forEach(function (R) { var t = firmTax(P - R) + n * indivTax(R / n); if (!best || t < best.t) best = { t: t, R: R }; });
      return { tax: best.t, note: "Partner remuneration of Rs " + fmt(best.R) + " split " + n + " ways; firm taxed on Rs " + fmt(P - best.R) + "; profit share exempt in partners' hands." };
    }
    var ct = coTax(P);
    if (mode === "retain") return { tax: ct, note: "Company tax at 25.168%; profit retained, no dividend." };
    var div = (P - ct) / n;
    return { tax: ct + n * indivTax(div), note: "Company tax Rs " + fmt(ct) + "; balance paid as dividend, Rs " + fmt(div) + " per shareholder taxed at slab rates." };
  }
  function fmt(x) { return Math.round(x).toLocaleString("en-IN"); }
  var PROFIT_POINTS = { lt_25L: 1000000, "25L_2cr": 10000000, gt_2cr: 50000000 };
  var TAX = {};
  Object.keys(PROFIT_POINTS).forEach(function (pk) {
    ["retain", "withdraw"].forEach(function (mode) {
      var row = {}, P = PROFIT_POINTS[pk];
      FORPROFIT.forEach(function (e) { var s = taxScenario(e, P, mode); row[e] = { tax: Math.round(s.tax), rate: s.tax / P, note: s.note }; });
      TAX[pk + "|" + mode] = row;
    });
  });
  // Python round(): half to even
  function pyRound(x) { var f = Math.floor(x), d = x - f; if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1; return Math.round(x); }
  function taxScore(e, pk, mode, pool) {
    var row = TAX[pk + "|" + mode], best = Math.min.apply(null, pool.map(function (x) { return row[x].rate; }));
    return Math.max(0, pyRound(10 - (row[e].rate - best) * 50));
  }

  /* ---------------- factors & scores (Part D3) ---------------- */
  var FACTORS = [
    { id: "F09", name: "Liability risk of the activity", weight: 20, basis: "LAW+JDG", input: "liability" },
    { id: "F06", name: "Funding route", weight: 15, basis: "MKT", input: "funding" },
    { id: "F10", name: "Tax on profit (profit level x extraction)", weight: 15, basis: "LAW", input: "profit_level+extraction" },
    { id: "F14", name: "Compliance appetite", weight: 15, basis: "JDG", input: "compliance" },
    { id: "F15", name: "Credibility with banks, tenders, large clients", weight: 10, basis: "MKT", input: "credibility" },
    { id: "F16", name: "Exit / succession plan", weight: 10, basis: "LAW+MKT", input: "exit" },
    { id: "F05", name: "Foreign money", weight: 5, basis: "LAW+REG", input: "foreign" },
    { id: "F19", name: "Startup India (DPIIT) eligibility value", weight: 5, basis: "REG", input: "business" },
    { id: "F20", name: "Formation cost and speed", weight: 5, basis: "MKT", input: "(always)" }
  ];
  //            PROP PF LLP OPC PVT PUB
  var SCORES = {
    liability: { critical: [0, 0, 9, 9, 10, 10], preferred: [3, 3, 8, 8, 9, 9], acceptable: [8, 7, 7, 6, 6, 4] },
    funding: { bank: [8, 8, 8, 7, 7, 3], vc: [0, 0, 3, 0, 10, 5], public: [0, 0, 0, 0, 3, 10] },
    compliance: { low: [10, 8, 6, 4, 3, 0], moderate: [8, 8, 8, 7, 7, 3], high: [6, 6, 7, 7, 9, 8] },
    credibility: { high: [3, 4, 7, 6, 9, 10], low: [8, 7, 7, 6, 6, 5] },
    exit: { sell: [2, 3, 6, 6, 10, 10], succession: [3, 5, 8, 6, 9, 8], none: [7, 6, 7, 6, 7, 5] },
    foreign: { none: [7, 7, 7, 7, 7, 6], investment: [0, 0, 6, 0, 10, 9], contribution: [5, 5, 5, 5, 5, 5] },
    business: { startup: [0, 6, 9, 3, 10, 3], professional: [5, 5, 5, 5, 5, 5], small: [5, 5, 5, 5, 5, 5] },
    cost: [10, 8, 6, 6, 5, 2]
  };
  var JUSTIFY = {
    F09: "Unlimited personal liability for proprietor and partners (Partnership Act s.25); limited for LLP (LLP Act ss.26-28) and companies. Companies score 1 above LLP because case law and lender familiarity are deeper (JDG).",
    F06: "Equity investors need shares, preference shares, convertible notes and ESOP pools; only companies issue shares. VC preference for Pvt Ltd over LLP is market convention, not law (MKT).",
    F10: "Computed from the effective tax on your profit level and extraction plan: 10 for the lowest rate among eligible structures, minus 1 point per 2 percentage points above it.",
    F14: "Relative count of mandatory filings, audits and meetings for each structure (JDG).",
    F15: "Lenders, tender documents and enterprise vendor onboarding commonly prefer or require incorporated entities (MKT).",
    F16: "Share transfer is the cleanest exit; a proprietorship can only be sold as an asset transfer; firm/LLP interests transfer with partner consent (LAW+MKT).",
    F05: "FDI into proprietorships and firms is not permitted; OPC members must be Indian citizens; LLP FDI is automatic only in 100%-automatic sectors (LAW/REG).",
    F19: "DPIIT recognition is available to Pvt Ltd, LLP and registered firms, not to proprietorships, OPCs (as practised) or public companies (REG).",
    F20: "Indicative formation plus first-year compliance cost ranking (MKT)."
  };

  /* ---------------- hard rules (Part D2) ---------------- */
  var RULES = {
    "R-001": { basis: "LAW", cite: "Companies Act 2013 s.8(1)", plain: "A charitable / not-for-profit objective can only be served by a Section 8 company within this tool's scope." },
    "R-002": { basis: "LAW", cite: "Companies Act 2013 s.8(1)(b)-(c)", plain: "A Section 8 company must apply profits to its objects and cannot pay dividends." },
    "R-003": { basis: "LAW", cite: "Partnership Act 1932 s.4; LLP Act 2008 s.6(1); Companies Act s.3(1)", plain: "Partnership and LLP need at least 2 partners; Pvt Ltd and Section 8 need 2 members; Public needs 7." },
    "R-004": { basis: "LAW", cite: "Companies Act s.2(62), s.3(1)(c)", plain: "A proprietorship has one owner; an OPC has exactly one member." },
    "R-005": { basis: "LAW", cite: "Companies Act s.3(1)(a), s.149(1)(a)", plain: "A public company needs at least 7 members and 3 directors (possible later if 7 members can be brought in)." },
    "R-006": { basis: "LAW", cite: "Companies Act s.464; Companies (Misc.) Rules 2014 r.10", plain: "A partnership of more than 50 persons is prohibited." },
    "R-007": { basis: "LAW", cite: "Companies Act s.2(68)(ii)", plain: "A private company is capped at 200 members (excluding employee/ex-employee members)." },
    "R-008": { basis: "LAW", cite: "Companies (Incorporation) Rules 2014 r.3(1); FEMA (Non-debt Instruments) Rules 2019", plain: "Only an Indian citizen can be an OPC member; foreign nationals face FEMA limits on proprietorships and firms.", review: true },
    "R-009": { basis: "LAW/REG", cite: "FEMA NDI Rules 2019; Consolidated FDI Policy; Companies (Incorporation) Rules r.3", plain: "FDI is not permitted in proprietorships and firms; an OPC cannot have a foreign shareholder. LLP FDI needs a sector check.", review: true },
    "R-010": { basis: "LAW", cite: "Foreign Contribution (Regulation) Act 2010 ss.11-12", plain: "Foreign donations need FCRA registration or prior permission; new entities usually cannot register at once.", review: true },
    "R-011": { basis: "LAW", cite: "Companies Act s.23(1); s.2(68)(iii)", plain: "Only a public company can invite the public to subscribe to securities." },
    "R-012": { basis: "LAW", cite: "Companies Act s.2(62), s.43; Partnership Act s.4", plain: "Proprietorships and firms cannot issue equity; an OPC cannot add a second member without converting." },
    "R-013": { basis: "LAW", cite: "Companies Act s.2(37), s.62(1)(b)", plain: "Statutory employee stock options exist only for companies with more than one member." },
    "R-014": { basis: "LAW/REG", cite: "Chartered Accountants Act 1949 s.2(2), s.7, s.25; parallel CS & CMA Acts", plain: "Members in practice may practise as individuals, firms or LLPs, not through companies." },
    "R-015": { basis: "REG", cite: "Advocates Act 1961; Bar Council of India Rules Part VI", plain: "Advocates cannot practise law through a company; law-firm LLPs exist but depend on the State Bar Council.", review: true },
    "R-016": { basis: "REG", cite: "Relevant professional council regulations", plain: "Doctors, architects and other regulated professionals must check council rules before choosing a corporate form.", review: true },
    "R-017": { basis: "LAW", cite: "RBI Act 1934 s.45-IA, s.45-I(f)", plain: "Only a company can apply for NBFC registration." },
    "R-018": { basis: "LAW", cite: "Insurance Act 1938 s.2(7A), s.2C", plain: "An Indian insurer must be a public company (subject to IRDAI).", review: true },
    "R-019": { basis: "LAW", cite: "Companies (Incorporation) Rules 2014 r.3(6); Companies Act s.3(1)", plain: "A one-person charity cannot be a Section 8 company; consider a trust (outside this tool's scope)." },
    "R-020": { basis: "LAW", cite: "Companies Act s.149(3); LLP Act s.7(1)", plain: "Every company needs one director resident 182+ days in the FY; every LLP needs one resident designated partner.", review: true },
    "R-021": { basis: "REG", cite: "Consolidated FDI Policy (DPIIT)", plain: "Sector licensing and FDI caps can override entity choice.", review: true },
    "R-022": { basis: "LAW", cite: "Companies Act s.8(1)", plain: "Section 8 can be formed as a private (2+ members) or public (7+ members) company." },
    "R-023": { basis: "LAW", cite: "FEMA (Non-debt Instruments) Rules 2019", plain: "An NRI may invest in a firm or proprietary concern only on the conditions FEMA allows (generally non-repatriation); confirm before choosing.", review: true },
    "R-024": { basis: "LAW+JDG", cite: "Partnership Act 1932 s.25; proprietor has no separate legal personality", plain: "You said claims could exceed your personal assets. A proprietor or partner is personally liable without limit, so these forms are removed." },
    "R-025": { basis: "LAW/REG", cite: "FEMA (Non-debt Instruments) Rules 2019; RBI Master Direction on Foreign Investment", plain: "A foreign national cannot set up a proprietorship or partnership in India without prior RBI approval. Companies and LLPs are the usual routes." },
    "TIE": { basis: "JDG", cite: "Rulebook D5", plain: "The top two structures are within 5 points of each other. Compare both side by side before deciding.", review: true }
  };

  function evaluate(a) {
    a = a || {};
    var elig = {}, excl = {}, review = [];
    ENT.forEach(function (e) { elig[e] = true; });
    function x(ents, rid) { ents.forEach(function (e) { if (elig[e]) { delete elig[e]; (excl[e] = excl[e] || []).push(rid); } }); }
    function only(ents, rid) { x(ENT.filter(function (e) { return ents.indexOf(e) < 0; }), rid); }
    function has(e) { return !!elig[e]; }

    var f = a.founders || "two_to_six";
    if (a.objective === "nonprofit") { only(["S8"], "R-001"); if (f === "seven_plus") review.push("R-022"); if (f === "one") x(["S8"], "R-019"); }
    else x(["S8"], "R-002");
    if (f === "one") x(["PF", "LLP", "PVT", "PUB"], "R-003"); else x(["PROP", "OPC"], "R-004");
    if (f === "one" || f === "two_to_six") x(["PUB"], "R-005");
    var mo = a.max_owners || "up_to_50";
    if (mo === "51_200" || mo === "over_200") x(["PF"], "R-006");
    if (mo === "over_200") x(["PVT", "OPC"], "R-007");
    var res = a.residency || "resident";
    if (res === "foreign_national") { x(["OPC"], "R-008"); review.push("R-008"); }
    if (res === "foreign_national") x(["PROP", "PF"], "R-025");
    if (res === "nri" && (has("PROP") || has("PF"))) review.push("R-023");
    if (a.liability === "critical") x(["PROP", "PF"], "R-024");
    if ((res === "nri" || res === "foreign_national") && a.all_non_resident) review.push("R-020");
    var fo = a.foreign || "none";
    if (fo === "investment") { x(["PROP", "PF", "OPC"], "R-009"); if (has("LLP")) review.push("R-009"); }
    if (fo === "contribution") review.push("R-010");
    var fu = a.funding || "bank";
    if (fu === "public" && a.objective !== "nonprofit") only(["PUB"], "R-011");
    if (fu === "vc") x(["PROP", "PF", "OPC"], "R-012");
    if (a.esop === "yes") x(["PROP", "PF", "LLP", "OPC"], "R-013");
    var pr = a.profession || "none";
    if (pr === "ca_cs_cma") x(["OPC", "PVT", "PUB"], "R-014");
    if (pr === "advocate") { x(["OPC", "PVT", "PUB"], "R-015"); if (has("LLP")) review.push("R-015"); }
    if (pr === "other_regulated") review.push("R-016");
    var act = a.activity || "none";
    if (act === "nbfc") only(["PVT", "PUB"], "R-017");
    if (act === "insurance") { only(["PUB"], "R-018"); review.push("R-018"); }
    if (act === "other_licensed") review.push("R-021");

    var eligible = ENT.filter(has);
    var out = { version: VERSION, eligible: eligible, excluded: excl, review: uniq(review) };
    if (!eligible.length) {
      // the rule that emptied the set = last rule that removed something
      var last = null; Object.keys(excl).forEach(function (e) { var r = excl[e][excl[e].length - 1]; if (!last || r > last) last = r; });
      out.verdict = "NONE"; out.confidence = "n/a"; out.ranking = []; out.emptiedBy = last; return out;
    }
    if (eligible.length === 1) { out.verdict = eligible[0]; out.confidence = "only eligible structure"; out.ranking = [[eligible[0], null]]; return out; }

    var pk = a.profit_level || "lt_25L", mode = a.extraction || "withdraw", scores = {}, breakdown = {};
    eligible.forEach(function (e) {
      var i = FORPROFIT.indexOf(e);
      var parts = {
        F09: 20 * SCORES.liability[a.liability || "preferred"][i],
        F06: 15 * SCORES.funding[fu][i],
        F10: 15 * taxScore(e, pk, mode, eligible.slice().sort()),
        F14: 15 * SCORES.compliance[a.compliance || "moderate"][i],
        F15: 10 * SCORES.credibility[a.credibility || "low"][i],
        F16: 10 * SCORES.exit[a.exit || "none"][i],
        F05: 5 * SCORES.foreign[fo][i],
        F19: 5 * SCORES.business[a.business || "small"][i],
        F20: 5 * SCORES.cost[i]
      };
      breakdown[e] = parts;
      var sum = 0; for (var k in parts) sum += parts[k];
      scores[e] = Math.round(sum) / 10;
    });
    var rank = Object.keys(scores).map(function (e) { return [e, scores[e]]; })
      .sort(function (p, q) { return q[1] - p[1] || FORPROFIT.indexOf(p[0]) - FORPROFIT.indexOf(q[0]); });
    var margin = Math.round((rank[0][1] - rank[1][1]) * 10) / 10;
    var conf = margin >= 10 ? "clear" : margin >= 5 ? "moderate" : "near-tie";
    if (conf === "near-tie") review.push("TIE");
    out.verdict = rank[0][0]; out.runner_up = rank[1][0]; out.margin = margin; out.confidence = conf;
    out.ranking = rank; out.breakdown = breakdown; out.review = uniq(review);
    return out;
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }).sort(); }

  /* ---------------- explanation templates (Part D6) ---------------- */
  var WHY = {
    PROP: { why: ["You are the only owner and want the simplest structure.", "At your expected profit, slab-rate tax is lower than a company's flat rate.", "Your answers show low liability risk and low compliance appetite."], whyNot: ["Partnership and LLP need at least two owners.", "An OPC adds a mandatory audit and a second tax layer on withdrawals.", "Companies are barred if you practise a regulated profession."] },
    PF: { why: ["You have two or more owners and a low-risk activity.", "You want the lowest compliance cost and full contractual flexibility.", "Profit share is exempt in partners' hands, so withdrawals are tax-efficient."], whyNot: ["An LLP adds MCA filings for limited liability you said you can do without.", "A company adds audit and dividend tax.", "Proprietorship and OPC allow only one owner."] },
    LLP: { why: ["You have two or more owners and want limited liability.", "You plan to withdraw most profits, which an LLP taxes once.", "You do not need shares or ESOPs."], whyNot: ["A partnership would leave every partner personally liable.", "A Pvt Ltd taxes withdrawn profit twice and needs more compliance.", "Proprietorship and OPC allow only one owner."] },
    OPC: { why: ["You are a single founder who wants limited liability.", "You plan to retain profits, taxed at a flat 25.168%.", "A company counterparty helps with clients or lenders."], whyNot: ["A proprietorship leaves your personal assets exposed.", "Partnership, LLP and Pvt Ltd need at least two owners.", "Withdrawing all profit would make the OPC tax-inefficient: revisit if that changes."] },
    PVT: { why: ["You plan to raise equity or grant ESOPs, which need shares.", "Liability protection and credibility matter for your business.", "Retained profits are taxed at a flat 25.168%."], whyNot: ["An LLP cannot issue shares or statutory ESOPs.", "A partnership exposes owners personally and cannot take investors.", "A public company needs 7 members, 3 directors and heavier compliance."] },
    PUB: { why: ["You intend to raise money from the public or list.", "You expect more than 200 members, or a regulator requires a public company.", "You can meet the 7-member, 3-director requirement."], whyNot: ["A Pvt Ltd cannot invite the public or exceed 200 members.", "An LLP or firm cannot issue securities.", "OPC and proprietorship are single-owner forms."] },
    S8: { why: ["Your objective is charitable or not-for-profit.", "You have at least two founders.", "A company form gives credibility with CSR and grant funders."], whyNot: ["For-profit forms allow profit distribution, which your objective excludes.", "An OPC cannot be a Section 8 company.", "Trusts and societies are outside this tool's scope."] }
  };
  // Each template sentence fires only when its condition holds (D6: suppress sentences whose condition did not fire).
  function explain(r, a) {
    var e = r.verdict; if (!WHY[e]) return { why: [], whyNot: [] };
    var c = {
      PROP: [a.founders === "one", r.breakdown ? true : (a.profit_level || "lt_25L") === "lt_25L", a.liability === "acceptable" || a.compliance === "low"],
      PF: [a.founders !== "one", a.compliance === "low" || a.liability === "acceptable", (a.extraction || "withdraw") === "withdraw"],
      LLP: [a.founders !== "one", (a.extraction || "withdraw") === "withdraw", a.esop !== "yes" && a.funding !== "vc"],
      OPC: [a.founders === "one", a.extraction === "retain", a.credibility === "high"],
      PVT: [a.funding === "vc" || a.esop === "yes", a.liability !== "acceptable" || a.credibility === "high", a.extraction === "retain"],
      PUB: [a.funding === "public", a.max_owners === "over_200" || a.activity === "insurance", a.founders === "seven_plus"],
      S8: [a.objective === "nonprofit", a.founders !== "one", true]
    }[e];
    var why = WHY[e].why.filter(function (_, i) { return c[i]; });
    if (!why.length) why = ["It scored highest across the weighted factors for your answers."];
    // "why not" — prefer real rule exclusions, then template lines
    var whyNot = [];
    Object.keys(r.excluded).forEach(function (k) { if (k === e) return; var rid = r.excluded[k][0]; whyNot.push(NAME[k] + " is excluded: " + RULES[rid].plain); });
    if (r.runner_up) whyNot.unshift(NAME[r.runner_up] + " came second, " + r.margin + " points behind.");
    return { why: why, whyNot: whyNot.length ? whyNot : WHY[e].whyNot };
  }

  var API = { VERSION: VERSION, VERIFIED: VERIFIED, NEXT_REVIEW: NEXT_REVIEW, ENT: ENT, FORPROFIT: FORPROFIT, NAME: NAME, APP_KEY: APP_KEY, FACTORS: FACTORS, SCORES: SCORES, JUSTIFY: JUSTIFY, RULES: RULES, TAX: TAX, PROFIT_POINTS: PROFIT_POINTS, evaluate: evaluate, explain: explain, taxScenario: taxScenario };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.BizEngine = Object.freeze(API);
})(typeof window !== "undefined" ? window : this);
