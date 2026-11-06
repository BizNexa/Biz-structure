/* BizMatrix knowledge layer: document checklist, registrations and compliances from
   Master Registration Checklist v1.0, Registration Master Map FY 2026-27 and the Initial & Annual Compliance Master.
   Public data = window.BIZ_KB (js/kb-public.js). Paid users receive the full catalog from the Worker (KB.hydrate). */
(function () {
  "use strict";
  const PUBLIC = window.BIZ_KB;
  let DATA = PUBLIC, FULL = false;

  /* ------------------------------------------------------------------ inputs → context */
  const PT_STATES = ["Maharashtra", "Karnataka", "Gujarat", "Tamil Nadu", "Telangana", "West Bengal", "Kerala", "Madhya Pradesh", "Andhra Pradesh", "Assam", "Odisha", "Bihar", "Jharkhand", "Meghalaya", "Manipur", "Mizoram", "Sikkim", "Tripura", "Nagaland", "Puducherry", "Punjab"];
  const LWF_STATES = ["Maharashtra", "Karnataka", "Gujarat", "Tamil Nadu", "Delhi", "Telangana", "West Bengal", "Kerala", "Madhya Pradesh", "Haryana", "Punjab", "Andhra Pradesh", "Chandigarh", "Goa", "Odisha"];
  const SPECIAL = ["Manipur", "Mizoram", "Nagaland", "Tripura"];
  const AGILE = ["Maharashtra", "Karnataka", "West Bengal"];
  const POLICE_EATING = ["Maharashtra", "Delhi"];
  const WF = { none: 0, "1_9": 1, "10_19": 10, "20_49": 20, "50p": 50 };
  const TO = { lt20: 0, "20_40": 1, "40_150": 2, "150_500": 3, gt500: 4 };
  const COMPANY = ["opc", "private_limited", "public_limited", "section8"];

  function ctx(a, key) {
    a = a || {};
    const acts = new Set((a.activities || []).filter(x => x !== "n")), ch = new Set((a.channels || []).filter(x => x !== "n")), plant = new Set((a.plant || []).filter(x => x !== "n"));
    const wf = WF[a.workforce] ?? 0, to = TO[a.turnover] ?? 0, st = a.state || "";
    const goodsOnly = a.supply === "g", special = SPECIAL.includes(st);
    const overThreshold = special ? to >= 1 : goodsOnly ? to >= 2 : to >= 1;
    const gstCompulsory = (a.interstate === "y" && a.supply !== "s") || ch.has("marketplace") || acts.has("marketplace_op");
    const r = a.residency || "resident";
    return {
      a, key, acts, ch, plant, wf, to, st, company: COMPANY.includes(key), corporate: key !== "sole" && key !== "partnership",
      gst: overThreshold || gstCompulsory, gstCompulsory, gstThreshold: overThreshold,
      gstBorderline: !overThreshold && !gstCompulsory && (special || to === 1 || (goodsOnly && to === 1)),
      pt: PT_STATES.includes(st), lwf: LWF_STATES.includes(st) && wf >= 1, agile: AGILE.includes(st),
      exporter: a.trade === "export" || a.trade === "both", importer: a.trade === "import" || a.trade === "both",
      foreignFounder: r === "foreign_national" || r === "foreign_all", foreignInv: a.foreign === "investment", foreignContr: a.foreign === "contribution",
      startup: a.business === "startup", premises: a.premises && a.premises !== "home", rented: a.premises === "rent" || a.premises === "relative",
      food: a.sector === "food" || acts.has("restaurant") || acts.has("food_mfg") || acts.has("cloud_kitchen"),
      sevenPlus: a.founders === "seven_plus"
    };
  }

  /* ------------------------------------------------------------------ activities (Part D) */
  const ACTIVITIES = [
    ["restaurant", "Restaurant, café, eating house or catering", ["food", "hos"], ["I01", "I02", "I03", "I04", "I06", "I60"]],
    ["cloud_kitchen", "Cloud kitchen / food delivery brand", ["food", "hos", "ecom"], ["I01", "I02", "I03", "I06"]],
    ["food_mfg", "Food manufacturing, processing or packaging", ["food", "agr", "mfg"], ["I01", "I02", "I03", "I17", "I24"]],
    ["liquor", "Alcohol manufacture, sale or bar", ["food", "hos"], ["I05"]],
    ["pharmacy", "Pharmacy / chemist / drug distribution", ["pha", "hc", "trd"], ["I07", "I08"]],
    ["drug_mfg", "Drug, AYUSH or cosmetics manufacturing", ["pha", "biotech", "mfg"], ["I09", "I12", "I17", "I18"]],
    ["devices", "Medical devices (make, import or sell)", ["pha", "hc", "biotech"], ["I10"]],
    ["cosmetics_import", "Import of cosmetics", ["pha", "import", "trd"], ["I11"]],
    ["clinic", "Clinic, hospital, lab or diagnostic centre", ["hc"], ["I13", "I14", "I15"]],
    ["factory", "Manufacturing in a factory", ["mfg", "auto", "chem", "text", "aero", "renew", "min", "print", "biotech", "pha", "food", "waste", "gems"], ["I16", "I17", "I23", "I27"]],
    ["plastic", "Plastic packaging (brand owner, producer or importer)", ["mfg", "print", "food", "ecom", "trd", "pha", "chem"], ["I19"]],
    ["electronics", "Electrical / electronic products or batteries", ["mfg", "auto", "trd", "import", "ecom", "renew", "waste"], ["I20", "I21", "I23"]],
    ["tyres_oil", "Tyres or used oil", ["auto", "mfg", "waste"], ["I22"]],
    ["lending", "Lending or NBFC activity", ["fin"], ["I28", "I35"]],
    ["payments", "Payment aggregation / gateway", ["fin", "ecom"], ["I29"]],
    ["advice", "Investment advice, research, PMS or broking", ["fin"], ["I30", "I31"]],
    ["fin_distribution", "Insurance, mutual fund or NPS distribution", ["fin", "ins"], ["I32", "I33", "I34"]],
    ["chit_forex", "Chit fund or money changing", ["fin"], ["I36", "I37"]],
    ["developer", "Real estate development / construction", ["re"], ["I38", "I64", "I65"]],
    ["broker", "Real estate broking", ["re"], ["I39"]],
    ["higher_ed", "College, university or technical courses", ["edu"], ["I40"]],
    ["school", "School", ["edu"], ["I41"]],
    ["coaching", "Coaching or training centre", ["edu"], ["I42"]],
    ["agri_trade", "Agricultural produce trading (APMC)", ["agr", "trd"], ["I43"]],
    ["agri_inputs", "Seeds, fertilisers or pesticides", ["agr", "chem"], ["I44"]],
    ["warehouse", "Warehousing or cold storage", ["agr", "trn"], ["I45", "I46"]],
    ["jewellery", "Gold jewellery retail", ["gems", "trd"], ["I47"]],
    ["transport", "Goods/passenger transport or ride-hailing", ["trn", "auto"], ["I48"]],
    ["drones", "Commercial drone operations", ["aero", "agr", "trn", "tel"], ["I49"]],
    ["customs", "Customs broking or multimodal freight", ["trn", "import"], ["I50", "I51"]],
    ["telecom", "Telecom / internet services", ["tel"], ["I52"]],
    ["media", "Newspapers, cable TV, digital news or OTT", ["tel", "print"], ["I53", "I54", "I55"]],
    ["security", "Private security agency", ["sec"], ["I56"]],
    ["recruitment", "Overseas recruitment", ["sec"], ["I57"]],
    ["hotel", "Hotel or lodging", ["hos"], ["I58", "I59", "I60"]],
    ["events", "Cinema, events or public music", ["hos", "tel"], ["I60", "I61"]],
    ["marketplace_op", "Operating an e-commerce marketplace", ["ecom"], ["I62", "I63"]],
    ["restricted", "Restricted, dual-use (SCOMET) or controlled substances", ["chem", "pha", "import", "aero"], ["I66", "I67"]],
    ["pets", "Pet shop or breeding", ["trd", "agr"], ["I68"]]
  ];
  const ACT = Object.fromEntries(ACTIVITIES.map(x => [x[0], x]));
  function activityOptions(sector) {
    const list = ACTIVITIES.filter(x => !sector || sector === "other" || x[2].includes(sector));
    const generic = ["marketplace_op", "payments", "telecom", "media", "recruitment", "events", "drones"];
    return (list.length ? list : ACTIVITIES.filter(x => generic.includes(x[0]))).map(x => [x[0], x[1], ""]).concat([["n", "None of these", "No specially licensed activity."]]);
  }

  /* ------------------------------------------------------------------ registration rules */
  // returns [applies:boolean, why:string] ; codes from the Map give M / C / O / N per entity
  function regRule(r, c) {
    const a = c.a, A = id => [...c.acts].some(k => ACT[k] && ACT[k][3].includes(id));
    const why = (ok, t) => [ok, t];
    switch (r.id) {
      case "T01": return why(true, "Every entity needs a PAN");
      case "T02": return why(c.corporate || c.wf >= 1 || c.to >= 3, c.wf >= 1 ? "You will pay salaries, which requires TDS" : "Entities deducting tax at source on rent, fees or contracts need a TAN");
      case "T03": case "T04": return why(a.objective === "nonprofit", "Section 8 company seeking tax exemption / donor deduction");
      case "T05": return why(c.startup, "You plan to seek DPIIT recognition");
      case "G01": return why(c.gstThreshold, "Your expected turnover crosses the GST threshold for " + (a.supply === "g" ? "goods" : "services or mixed supplies"));
      case "G02": return why(c.gstCompulsory, a.interstate === "y" ? "Inter-state supply of goods needs GST registration regardless of turnover" : "Selling through e-commerce operators needs GST registration");
      case "G03": return why(c.gst && c.to <= 2 && !c.exporter && a.supply !== "s", "Turnover within the composition limit; optional lower-rate scheme");
      case "G04": return why(c.gst, "Faster GST grant for small or low-risk applicants");
      case "G07": return why(c.to >= 4, "Turnover above ₹5 crore requires e-invoicing");
      case "G08": return why(c.gst && a.supply !== "s", "Moving goods worth over ₹50,000 needs e-way bills");
      case "G09": return why(c.exporter && c.gst, "Exports without paying IGST need an LUT each year");
      case "S01": return why(c.pt, c.st + " levies Professional Tax");
      case "S02": return why(c.pt && c.wf >= 1, c.st + " levies Professional Tax on salaries");
      case "S03": return why(c.premises || c.wf >= 1, "You operate an establishment or employ staff");
      case "S04": return why(c.lwf, c.st + " has a Labour Welfare Fund");
      case "S05": return why(c.premises && (c.food || ["trd", "hos", "hc", "food"].includes(a.sector) || a.premises === "factory"), "Municipal trade licence for your premises and trade");
      case "S06": return why(a.premises === "factory" || A("I13") || A("I58") || c.acts.has("restaurant") || c.acts.has("events"), "Your premises type needs a fire safety NOC");
      case "S07": return why(c.premises && ["trd", "food", "hos"].includes(a.sector), "External signboards need a municipal licence");
      case "L01": return why(c.wf >= 10, "10 or more workers: OSH Code establishment registration");
      case "L02": return why(a.premises === "factory" && c.wf >= 20, "A factory with 20 or more workers");
      case "L03": return why(a.contract === "y" && (c.wf >= 50 || a.sector === "sec"), "Contractors employing 50+ contract workers need a licence");
      case "L04": return why(c.wf >= 20, "20 or more employees: EPF is mandatory");
      case "L05": return why(c.wf >= 10 && a.ec === "y", "10 or more employees, some within the ESIC wage ceiling");
      case "L06": return why(a.sector === "re" && c.wf >= 10, "Building and construction work with 10+ workers");
      case "L07": return why(c.acts.has("marketplace_op") || c.acts.has("transport"), "Platform aggregators have gig-worker obligations");
      case "L08": return why(c.wf >= 50, "Establishments with 30+ workers must engage apprentices");
      case "M01": return why(a.objective !== "nonprofit", "Free MSME registration: proof of existence, priority lending, delayed-payment protection");
      case "M02": return why(c.startup, "You plan to apply for Startup India recognition");
      case "M03": return why(c.ch.has("govt"), "You plan to sell to government buyers");
      case "M04": return why(c.ch.has("govt") || c.to >= 3, "Faster payment on receivables from large buyers");
      case "M05": return why(c.ch.has("govt"), "Tender benefits for micro and small enterprises");
      case "X01": return why(c.importer || c.exporter, "You plan to import or export");
      case "X02": case "X03": return why(c.exporter, "Exporters need port AD codes and an RCMC for FTP benefits");
      case "X04": return why(c.foreignInv && c.company, "Companies receiving FDI report it to the RBI");
      case "X05": return why(c.foreignInv && c.key === "llp", "LLPs receiving FDI report it to the RBI");
      case "X06": return why(c.foreignInv, "Entities with FDI file the annual FLA return");
      case "X07": return why(c.foreignInv, "Check: investors from a land-border country need government approval");
      case "X09": return why(c.to >= 4, "Large borrowers and high-value payments need an LEI");
      case "X10": return why(c.foreignContr, "Foreign donations need FCRA registration before receipt");
      case "X11": case "X12": return why(a.objective === "nonprofit", "Non-profits receiving CSR funds or government grants");
      case "D02": return why(c.ch.has("website") || c.ch.has("marketplace") || c.wf >= 1, "You process personal data of customers or staff (DPDP Act duties from 13 May 2027)");
      case "D03": return why(c.ch.has("sms"), "Commercial SMS requires TRAI DLT registration");
      case "P01": return why(true, "Protects your brand name; file early");
      case "P02": return why(c.startup || ["mfg", "biotech", "pha", "tel", "print", "edu"].includes(a.sector), "Protect creative works, designs or inventions");
    }
    if (r.scope === "industry") {
      if (r.id === "I01") return why(A("I01") && c.to === 0, "Food business with turnover up to ₹12 lakh");
      if (r.id === "I02") return why(A("I02") && c.to >= 1 && c.to <= 3 && !(c.importer || c.acts.has("cloud_kitchen")),"Food business with turnover between ₹12 lakh and ₹20 crore");
      if (r.id === "I03") return why(A("I03") && (c.to >= 4 || c.importer || c.acts.has("cloud_kitchen")), "Large, importing or e-commerce food business (confirm the tier)");
      if (r.id === "I04") return why(c.acts.has("restaurant") && POLICE_EATING.includes(c.st), "Eating houses in notified cities need a police licence");
      if (r.id === "I16") return why(A("I16") && c.wf >= 20 && a.premises === "factory", "Factory with 20+ workers");
      if (r.id === "I17") return why(A("I17") || (a.premises === "factory") || c.plant.has("h"), "Manufacturing units need pollution consent (CTE/CTO)");
      if (r.id === "I18") return why(c.plant.has("h") || (A("I18") && c.plant.has("h")), "You handle hazardous chemicals or waste");
      if (r.id === "I24") return why(a.packaged === "y" || (A("I24") && a.packaged === "y"), "You sell pre-packaged goods");
      if (r.id === "I25") return why(c.plant.has("x"), "You store explosives, petroleum or gas cylinders");
      if (r.id === "I26") return why(c.plant.has("b"), "You operate a boiler");
      if (r.id === "I23") return why(A("I23"), "Your products may fall under a BIS Quality Control Order");
      if (r.id === "I28") return why(A("I28") && (a.activity === "nbfc" || c.company), "NBFC activity needs an RBI Certificate of Registration");
      if (r.id === "I47") return why(A("I47") && c.to >= 2, "Gold jewellery sellers above ₹40 lakh turnover");
      if (r.id === "I62") return why(c.acts.has("marketplace_op") || c.ch.has("marketplace"), c.acts.has("marketplace_op") ? "E-commerce operators must register for GST and collect TCS" : "Selling through e-commerce operators needs GST registration");
      return why(A(r.id), "Triggered by your activity: " + [...c.acts].filter(k => ACT[k] && ACT[k][3].includes(r.id)).map(k => ACT[k][1]).join(", "));
    }
    return why(false, "");
  }

  function registrations(key, a) {
    const c = ctx(a, key), out = [];
    for (const r of DATA.registrations) {
      const code = (r.codes || {})[key] || "N";
      if (code === "N") continue;
      const [ok, why] = regRule(r, c);
      if (!ok) continue;
      const level = r.scope === "industry" ? "triggered" : code === "M" ? "mandatory" : code === "O" ? "recommended" : "triggered";
      out.push({ ...r, level, why });
    }
    if (c.gstBorderline && !out.some(x => x.id === "G01")) {
      const g = DATA.registrations.find(x => x.id === "G01");
      if (g) out.push({ ...g, level: "watch", why: "Your turnover is close to the GST threshold: register as soon as you cross it" });
    }
    const order = { mandatory: 0, triggered: 1, watch: 2, recommended: 3 };
    return out.sort((x, y) => order[x.level] - order[y.level]);
  }

  /* ------------------------------------------------------------------ documents */
  function docTest(cond, c) {
    const a = c.a;
    switch (cond) {
      case "": return true;
      case "noDin": return a.din !== "yes";
      case "hasDin": return a.din === "yes" || a.din === "some";
      case "foreignFounder": return c.foreignFounder;
      case "foreignInvestment": return c.foreignInv;
      case "foreignContribution": return c.foreignContr;
      case "corporateOwner": return a.corp_owner === "yes";
      case "rentedPremises": return c.rented || a.premises === "home";
      case "agileState": return c.agile;
      case "ptState": return c.pt;
      case "gst": return c.gst;
      case "trade": return c.importer || c.exporter;
      case "sevenPlus": return c.sevenPlus;
      case "upToSeven": return !c.sevenPlus;
      case "commercialPremises": return c.premises;
      case "indianFounder": return a.residency !== "foreign_all";
      case "check": return true;
    }
    return true;
  }
  function documents(key, a) {
    const e = DATA.checklist[key]; if (!e) return { steps: [], docs: [] };
    const c = ctx(a, key);
    return { name: e.name, summary: e.summary, steps: e.steps, docs: e.docs.filter(d => docTest(d.cond, c)) };
  }

  /* ------------------------------------------------------------------ compliances */
  function compTest(cond, c) {
    const a = c.a;
    switch (cond) {
      case "": return true;
      case "foreignContribution": return c.foreignContr;
      case "foreignInvestment": return c.foreignInv;
      case "odi": return false;
      case "trade": return c.importer || c.exporter;
      case "food": return c.food;
      case "startup": return c.startup;
      case "large": return c.to >= 4 || c.key === "public_limited";
      case "premises": return c.premises || c.wf >= 1;
      case "einvoice": return c.to >= 4;
      case "gstLarge": return c.gst && c.to >= 4;
      case "gst": return c.gst;
      case "epf": return c.wf >= 20;
      case "esic": return c.wf >= 10 && a.ec === "y";
      case "lwf": return c.lwf;
      case "pt": return c.pt;
      case "contract": return a.contract === "y";
      case "employees": return c.wf >= 1;
      case "taxAudit": return c.to >= 3 || (c.to === 2);
      case "tds": return c.corporate || c.wf >= 1 || c.to >= 3;
      case "csr": return c.to >= 4;
      case "msmeDues": return c.company || c.key === "llp";
      case "personalData": return c.ch.has("website") || c.ch.has("marketplace");
    }
    return true;
  }
  const FREQ = f => /once/i.test(f) ? "once" : /month/i.test(f) ? "monthly" : /qtr|quarter/i.test(f) ? "quarterly" : /half/i.test(f) ? "half-yearly" : /annual|year/i.test(f) ? "annual" : /3-yr|trienn/i.test(f) ? "annual" : "event";
  function compliances(key, a) {
    const c = ctx(a, key);
    return (DATA.compliance[key] || []).filter(r => compTest(r.cond, c)).map(r => ({ ...r, kind: FREQ(r.freq) }));
  }

  /* ------------------------------------------------------------------ preview gating (35%) */
  const share = n => Math.max(1, Math.ceil(n * 0.35));
  function gate(list) {
    if (FULL || AccessProvider.isPremium()) return { visible: list, locked: 0, total: list.length };
    const withDetail = list.filter(x => x.detail);
    const n = Math.min(share(list.length), withDetail.length);
    return { visible: withDetail.slice(0, n), locked: list.length - n, total: list.length };
  }

  /* ------------------------------------------------------------------ action plan */
  function actionPlan(key, a) {
    const e = ENTITIES[key], docs = documents(key, a), regs = registrations(key, a), comp = compliances(key, a), c = ctx(a, key);
    const flags = typeof reviewFlags === "function" ? reviewFlags() : [];
    const P = [];
    const add = (phase, title, text, when, owner, priority, ref) => P.push({ phase, title, text, when, owner, priority, ref: ref || "" });
    // Phase 1: decide & prepare
    if (flags.length) add(1, "Get professional sign-off on the structure", "Your answers raised " + flags.length + " review point(s) (" + flags.join(", ") + "). Book a 30-minute call with a CA, CS or lawyer before filing anything.", "Week 0", "Founders + CA/CS", "Critical");
    add(1, "Lock the name and protect the brand", c.corporate ? "Shortlist two names, check the MCA name index and the IP India trademark register, then file a trademark application early." : "Check the IP India trademark register for your trade name; a proprietorship or firm name has no protection without a trademark.", "Week 0", "Founders", "High", "P01");
    const kyc = docs.docs.filter(d => /kyc|identity|address|pan|aadhaar|photo/i.test(d.cat + " " + d.name)).length;
    add(1, "Collect founder KYC and premises documents", kyc + " identity, address and premises documents are on your checklist" + (c.rented ? ", including the rent agreement, owner NOC and a utility bill under 2 months old" : "") + ".", "Week 0–1", "Founders", "High");
    if (c.corporate) add(1, "Get Class 3 DSCs" + (a.din === "yes" ? "" : " and plan DIN / DPIN allotment"), "Every proposed director / designated partner needs a valid Class 3 digital signature" + (a.din === "yes" ? "." : "; DINs are allotted inside the incorporation form."), "Week 0–1", "Founders + CS", "High");
    // Phase 2: incorporate / register (entity steps)
    docs.steps.filter(s => !(c.corporate && /pre-registration|^name/i.test(s.stage))).forEach(s => add(2, s.stage, s.text, "Week 1–3", c.corporate ? "CS / CA" : "Founders", "High", s.id));
    // Phase 3: first 30 days — mandatory and triggered registrations
    regs.filter(r => r.level === "mandatory" || r.level === "triggered").forEach(r => {
      const tl = (r.detail && r.detail.timeline) || "";
      add(3, r.name.replace(/\s*\(.*?\)\s*/g, " ").trim(), r.why + ".", tl || "Before you start trading", /GST|PAN|TAN|IEC|Udyam/i.test(r.name) ? "CA" : "Founders / consultant", r.level === "mandatory" ? "Critical" : "High", r.id);
    });
    // Phase 4: first 180 days — initial compliances
    comp.filter(r => r.part === "initial" && r.kind !== "event").slice(0, 14).forEach(r => add(4, r.title, (r.detail && r.detail.applicability) || "Initial compliance for a new " + (e ? e.name : "entity") + ".", (r.detail && r.detail.due) || "First year", c.company ? "CS / CA" : "CA", "Medium", r.id));
    // Phase 5: run the year
    const yearly = comp.filter(r => r.part === "annual" && ["monthly", "quarterly", "annual"].includes(r.kind));
    const pick = re => yearly.find(r => re.test(r.title));
    [[/GSTR-3B|GST return/i, "Monthly"], [/TDS|TCS/i, "Quarterly"], [/Advance tax/i, "Quarterly"], [/Income-tax return|ITR/i, "Annual"], [/financial statements|AOC-4|Form 8/i, "Annual"], [/Annual return|MGT-7|Form 11/i, "Annual"], [/AGM|Annual General/i, "Annual"], [/KYC/i, "Annual"]].forEach(([re, f]) => { const r = pick(re); if (r) add(5, r.title, "Recurring " + f.toLowerCase() + " compliance.", (r.detail && r.detail.due) || f, "CA / CS", "High", r.id); });
    add(5, "Set up a compliance calendar with reminders", "Put every recurring due date into one shared calendar and review it monthly with your accountant; late fees under the LLP and Companies Acts run at ₹100 per day per form with no cap for LLPs.", "Month 1", "Founders", "High");
    // Phase 6: grow & watch thresholds
    const watch = [];
    if (!c.gst) watch.push("GST: register within 30 days of crossing ₹" + (a.supply === "g" ? "40" : "20") + " lakh turnover, or before any inter-state goods sale or marketplace listing");
    if (c.wf < 10) watch.push("ESIC and OSH Code at 10 workers");
    if (c.wf < 20) watch.push("EPF at 20 employees");
    if (c.to < 3) watch.push("Tax audit above ₹1 crore turnover (₹10 crore if 95%+ digital)");
    if (c.to < 4) watch.push("E-invoicing above ₹5 crore turnover");
    if (watch.length) add(6, "Watch these thresholds", watch.join("; ") + ".", "Ongoing", "Founders + CA", "Medium");
    regs.filter(r => r.level === "recommended").slice(0, 4).forEach(r => add(6, r.name.replace(/\s*\(.*?\)\s*/g, " ").trim(), r.why + ".", "When useful", "Founders", "Optional", r.id));
    return P;
  }
  const PHASES = { 1: ["Decide & prepare", "Week 0–1"], 2: ["Incorporate / register the entity", "Week 1–3"], 3: ["Registrations to start trading", "First 30 days"], 4: ["First-year setup compliances", "Days 30–180"], 5: ["Run the year: recurring filings", "FY 2026-27"], 6: ["Grow & stay ahead", "Ongoing"] };

  /* ------------------------------------------------------------------ summary */
  function summary(key, a) {
    const docs = documents(key, a), regs = registrations(key, a), comp = compliances(key, a), plan = actionPlan(key, a);
    return {
      docs: docs.docs.length, docsMandatory: docs.docs.filter(d => d.mandatory).length,
      regsMandatory: regs.filter(r => r.level === "mandatory").length, regsTriggered: regs.filter(r => r.level === "triggered").length, regsRecommended: regs.filter(r => r.level === "recommended").length,
      compInitial: comp.filter(r => r.part === "initial").length, compAnnual: comp.filter(r => r.part === "annual").length,
      monthly: comp.filter(r => r.kind === "monthly").length, quarterly: comp.filter(r => r.kind === "quarterly").length,
      next: plan.filter(p => p.phase === 1).concat(plan.filter(p => p.phase === 2).slice(0, 1), plan.filter(p => p.phase === 3 && p.priority === "Critical"), plan.filter(p => p.phase === 3 && p.priority !== "Critical")).slice(0, 6), time: (DATA.checklist[key] || {}).summary || {}
    };
  }

  function hydrate(full) {
    if (!full || full.version !== 2 || !full.checklist || !full.registrations) return false;
    DATA = full; FULL = true; return true;
  }
  function reset() { DATA = PUBLIC; FULL = false; }

  window.KB = Object.freeze({ ctx, activityOptions, registrations, documents, compliances, actionPlan, summary, gate, hydrate, reset, PHASES, ACTIVITIES, get full() { return FULL; }, get verified() { return DATA.verified; } });
})();

/* entity for Part 2 skip rules (from the Part 1 engine result) */
function kbEntityKey(a) {
  try { const r = BizEngine.evaluate(engineInputs(a)); return r.verdict && r.verdict !== "NONE" ? BizEngine.APP_KEY[r.verdict] : null; } catch (e) { return null; }
}
