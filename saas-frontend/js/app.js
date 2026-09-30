
const ICONS={
grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></svg>',
file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v5c0 5-3.3 8.2-8 10-4.7-1.8-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
compare:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4H4v16h4M16 4h4v16h-4M10 8h4M10 12h4M10 16h4"/></svg>',
route:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h5a4 4 0 014 4v6M17 19h-5a4 4 0 01-4-4V9"/></svg>'
};
document.querySelectorAll('[data-icon]').forEach(x=>x.innerHTML=ICONS[x.dataset.icon]);

const ENTITIES={
private_limited:{
name:"Private Limited Company",legal:"Separate legal entity",liability:"Limited to unpaid share capital",compliance:"High",members:"Minimum 2 shareholders + 2 directors; maximum 200 shareholders",audit:"Mandatory regardless of turnover or capital",funding:"Equity, preference shares, CCPS, ESOPs, debentures, VC, angel and PE funding are identified in the source.",ownership:"Shareholders own through shares; Board of Directors manages company affairs.",tax:"For Tax Year 2026–27, the Finance Act 2026 rate schedule provides a 25% / 30% domestic-company framework, with separate concessional regimes subject to their conditions. The engine does not treat an old-section label as a substitute for the new Act transition mapping.",best:"Startups, scale-ups, funded businesses and businesses expecting outside investors.",
docs:[
["Directors & Shareholders",["PAN of directors/shareholders","Aadhaar / identity proof","Recent photographs","Address proof","Email and mobile details","Specimen signature","Class 3 DSC"]],
["Registered Office",["Utility bill","Property tax receipt where applicable","Owner NOC","Rent / lease agreement where applicable"]],
["Company Information",["3–4 proposed names","Business activity description","Authorized and paid-up capital","Shareholding pattern"]],
["Constitutional Documents",["MOA","AOA","DIR-2","INC-9","First-director resolution"]]
],
comp:[
["Initial","Within 30 days","First Board Meeting","First Board meeting within 30 days of incorporation."],
["Initial","Within 30 days","First Auditor / ADT-1","Appointment of first auditor and related filing requirements."],
["Initial","Within 30 days","Registered Office","Establish registered office within the applicable period."],
["Initial","Within 60 days","Share Certificates","Issue share certificates within the prescribed period."],
["Initial","Within 180 days","INC-20A","Commencement declaration after subscription money is paid."],
["Annual","FY 2026–27","AOC-4","Annual financial statement filing."],
["Annual","FY 2026–27","MGT-7","Annual return filing."],
["Annual","Applicable cycle","DIR-3 KYC","Director KYC according to the applicable regime."],
["Tax","Tax Year 2026–27","Company income-tax return","Use the form prescribed under the Income-tax Rules, 2026 once notified."],
["Event Based","As event occurs","Corporate Change Filings","Changes in directors, office, share capital and other reportable events may require MCA filings."]
]},
llp:{
name:"Limited Liability Partnership",legal:"Separate legal entity",liability:"Limited to agreed contribution, subject to applicable exceptions",compliance:"Moderate",members:"Minimum 2 partners; no upper limit",audit:"Mandatory when the applicable turnover/contribution threshold is crossed",funding:"Partner contribution and loans; no ordinary equity-share funding route.",ownership:"Partners hold interests through capital contribution and the LLP Agreement.",tax:"For Tax Year 2026–27, the Finance Act 2026 rate schedule specifies 30% on the whole of total income for a firm; applicable surcharge, cess and AMT must be evaluated separately.",best:"Professional firms, consultancies, bootstrapped SMEs and service businesses.",
docs:[
["Partners & Designated Partners",["PAN","Aadhaar / passport / identity proof","Address proof","Photograph","Class 3 DSC","DIN identification details","Resident designated partner proof"]],
["Registered Office",["Recent utility bill","Owner NOC","Rent / lease agreement","Ownership documents where applicable"]],
["LLP Constitution",["Subscriber sheet","Form 9 consent","LLP Agreement","Capital contribution details","Bank proof of contribution"]],
["Special Situations",["Foreign partner documents where applicable","Apostille / notarisation where applicable","Professional certification where applicable","Business plan / project report where required"]]
],
comp:[
["Initial","Within 30 days","LLP Agreement — Form 3","File the LLP Agreement through the applicable Form 3 process."],
["Annual","30 May 2027","Form 11 — Annual Return","Reports partners, designated partners, contribution and changes."],
["Annual","30 October 2027","Form 8 — Statement of Account & Solvency","Financial position and solvency declaration."],
["Annual","Applicable cycle","DIR-3 KYC","Designated partner KYC according to the applicable regime."],
["Tax","Tax Year 2026–27","Firm / LLP income-tax return","Use the form prescribed under the Income-tax Rules, 2026 once notified; due date depends on applicable audit requirements."],
["Audit","Threshold based","Tax Audit","Audit applies when prescribed turnover/contribution conditions are met."],
["Tax","Periodic","GST Returns","GSTR-1/GSTR-3B and annual return where applicable."],
["Event Based","As event occurs","Partner / Agreement / Office Changes","Applicable event-based forms may be required."]
]},
sole:{
name:"Sole Proprietorship",legal:"No separate legal identity from proprietor",liability:"Unlimited personal liability",compliance:"Lowest",members:"1 proprietor",audit:"Threshold-based tax audit where applicable",funding:"Owner-funded / loans; not an equity-investor structure.",ownership:"Complete direct control by proprietor.",tax:"Business income is taxed in the proprietor's individual tax framework; the source identifies ITR-3 / ITR-4 and presumptive taxation.",best:"Solo freelancers, small shopkeepers, local traders and small owner-managed businesses.",
docs:[
["Proprietor KYC",["PAN","Aadhaar","Government identity proof","Photograph"]],
["Business Address",["Business address proof","Rent agreement where applicable","Landlord NOC","Utility bill"]],
["Business Registrations",["Shop & Establishment where applicable","Udyam / MSME","GST where applicable","Trade licence where applicable","Professional Tax where applicable"]],
["Industry Specific",["FSSAI for food businesses","Fire safety where applicable","Pollution clearance where applicable","Labour registration where applicable","Sector-specific licences"]]
],
comp:[
["Tax","Annual","ITR-3 / ITR-4","Return selection depends on applicable books/presumptive-tax conditions."],
["Tax","Quarterly where applicable","Advance Tax","Quarterly advance tax where applicable."],
["Tax","Periodic","GST Returns","Applicable where GST registration applies."],
["Tax","Quarterly where applicable","TDS Returns","Applicable where the proprietor deducts TDS."],
["Audit","Threshold based","Tax Audit","Applicable when prescribed turnover/receipt conditions are crossed."],
["State","State-specific","Professional Tax","Applicable according to state law."],
["Employees","Threshold based","EPF / ESI","Employee registrations apply when relevant thresholds are reached."],
["Event Based","Renewal cycle","Licences","State/activity-specific licences may require renewal."]
]},
partnership:{
name:"Partnership Firm",legal:"No separate legal entity",liability:"Unlimited joint and several liability",compliance:"Moderate",members:"Minimum 2 partners; source describes maximum of 50",audit:"Threshold-based",funding:"Partner contribution / loans; cannot issue ordinary shares to equity investors.",ownership:"Partners operate according to the Partnership Deed.",tax:"For Tax Year 2026–27, the Finance Act 2026 rate schedule specifies 30% on the whole of total income for a firm; applicable surcharge, cess and AMT must be evaluated separately.",best:"Small traders, family businesses and professional partnerships.",
docs:[
["Partner KYC",["PAN of partners","Aadhaar / Voter ID / Passport","Residential address proof","Photographs"]],
["Firm Constitution",["Partnership Deed","Form A / registration statement","Affidavit","Firm PAN"]],
["Business Address",["Address proof","Rent agreement","Landlord NOC","Utility bill"]],
["Banking & Tax",["Firm PAN","Bank statements","Current-account documentation"]]
],
comp:[
["Annual","Annual","Tax Year 2026–27 return form — to be confirmed from the Income Tax Department notification before filing.","Income-tax return for the firm/LLP. For Tax Year 2026–27, use the form prescribed under the Income-tax Rules, 2026 once notified."],
["Tax","Periodic","GST Returns","Applicable where GST registered."],
["Tax","Quarterly where applicable","TDS Returns","Applicable where TDS provisions apply."],
["Audit","Threshold based","Tax Audit","Applicable when prescribed turnover conditions are crossed."],
["Records","Ongoing","Books & Financial Records","Maintain ledgers, journals, vouchers, invoices and bank records."],
["Employees","Threshold based","EPF / ESI","Applicable where workforce thresholds are met."]
]},
opc:{
name:"One Person Company",legal:"Separate legal entity",liability:"Limited to unpaid share value",compliance:"Moderate",members:"1 member + 1 nominee",audit:"Statutory audit is mandatory",funding:"Limited investor appeal compared with a Private Limited Company.",ownership:"Single member/shareholder with nominee-based succession.",tax:"OPC taxation follows the domestic-company framework. For Tax Year 2026–27, apply the Finance Act 2026 / Income-tax Act 2025 framework and applicable conditions.",best:"Individual entrepreneurs seeking corporate identity and limited liability.",
docs:[
["Member / Nominee",["PAN","Aadhaar / passport","Residential address proof","Photograph","Nominee consent"]],
["Registered Office",["Ownership proof","Property tax receipt where applicable","Rent agreement","Owner NOC","Utility bill"]],
["Constitutional Documents",["MOA","AOA","DIR-2","INC-9","Applicable professional declaration"]],
["Digital Filing",["Class 3 DSC","DIN where applicable","SPICe+ documentation","PAN/TAN incorporation documentation"]]
],
comp:[
["Initial","Within 30 days","First Auditor","First auditor appointment."],
["Initial","Within 2 months","Share Certificate","Issue share certificate within the applicable period."],
["Initial","Within 180 days","INC-20A","Commencement declaration."],
["Annual","FY 2026–27","AOC-4","Annual financial statement filing."],
["Annual","FY 2026–27","MGT-7A","Annual return for OPC."],
["Annual","Applicable cycle","DIR-3 KYC","Director KYC according to applicable regime."],
["Tax","Annual","Tax Year 2026–27 company return form — to be confirmed from the Income Tax Department notification before filing.","Tax Year 2026–27 company return form — confirm the new prescribed form before filing."],
["Audit","Annual","Statutory Audit","Mandatory statutory audit."]
]},
public_limited:{
name:"Public Limited Company",legal:"Separate legal entity",liability:"Limited to amount unpaid on shares",compliance:"Very High",members:"Minimum 7 members and 3 directors",audit:"Corporate statutory audit requirements apply",funding:"Public issues, rights issues and private placements subject to applicable law.",ownership:"Share-capital / shareholding ownership with broader transferability subject to law and Articles.",tax:"The supplied source does not provide a separate Public Limited tax-rate table; this engine does not invent one.",best:"Businesses requiring broader capital access and potential public-market funding.",
docs:[
["Shareholders & Directors",["Identity proof","PAN","DSC","DIN","Address proof"]],
["Registered Office",["Recent utility bill","Owner NOC / consent letter"]],
["Constitution",["MOA","AOA"]]
],
comp:[
["Initial","Within 30 days","First Board Meeting","First Board meeting."],
["Initial","Within 30 days","First Auditor","First auditor appointment."],
["Initial","Within 30 days","Registered Office","Establish registered office."],
["Initial","Within 60 days","Share Certificates","Issue share certificates."],
["Initial","Within 180 days","Commencement of Business","Commencement declaration where applicable."],
["Annual","Ongoing","Statutory Registers & Books","Maintain statutory registers and books."],
["Annual","Annual","AOC-4 / MGT-7","Annual financial statement and annual return filings."]
]},
section8:{
name:"Section 8 Company",legal:"Separate legal entity",liability:"Limited liability",compliance:"High",members:"Minimum 2 members and 2 directors for the private-company form described in the source",audit:"Statutory audit every financial year",funding:"Domestic donations, CSR funding, grants and foreign contributions subject to applicable approvals/conditions.",ownership:"Profits cannot be distributed as dividends and must be applied toward stated objects.",tax:"Incorporation does not itself create automatic income-tax exemption; 12AB / 80G and the applicable Tax Year 2026–27 return framework must be evaluated separately.",best:"Charitable, educational, social welfare, research, sports and environmental initiatives.",
docs:[
["Directors & Members",["PAN","Aadhaar / identity proof","Address proof","Photographs","Class 3 DSC"]],
["Registered Office",["Utility bill","Ownership proof","Owner NOC","Rent agreement where applicable"]],
["Section 8 Constitutional Documents",["MOA — INC-13","AOA","Projected statement for next 3 years","INC-9","INC-14","INC-15","DIR-2"]],
["Foreign Funding",["FCRA registration / prior permission where applicable"]]
],
comp:[
["Initial","Incorporation","Section 8 Licence","Section 8 licence is part of the incorporation framework."],
["Annual","Each calendar year","Board Meetings","Board meetings according to applicable corporate requirements."],
["Annual","By 30 September 2027","AGM","Annual General Meeting."],
["Annual","By 30 October 2027","AOC-4","Audited financial statements filed with ROC."],
["Annual","By 29 November 2027","MGT-7","Annual return filing."],
["Annual","Annual","Statutory Audit","Mandatory statutory audit."],
["Tax","Tax Year 2026–27","Section 8 / eligible entity income-tax return","Use the form prescribed under the Income-tax Rules, 2026 once notified; applicability depends on the entity's tax position."],
["Tax","Ongoing","12AB / 80G","Separate tax-benefit registrations/approvals as applicable."],
["Event Based","As applicable","FCRA","Foreign contribution requires applicable FCRA registration/prior permission."]
]}
};

const QUESTIONS=[
{id:"objective",cat:"Business Objective",title:"What is the fundamental objective of the organisation?",desc:"This is the first structural filter because the source treats non-profit activity differently from ordinary commercial businesses.",opts:[["profit","For-profit business","Commercial business intended to generate profits."],["nonprofit","Non-profit / charitable / social initiative","Charitable, educational, social welfare, research, sports or similar objective."]]},
{id:"founders",cat:"Ownership",title:"How many founders / owners will initially participate?",desc:"Founder count determines which structures can accommodate the proposed ownership model.",opts:[["one","1 founder","Single entrepreneur / owner."],["two_to_six","2–6 founders / owners","Closely held multi-owner business."],["seven_plus","7 or more founders / members","Seven or more does not by itself require a Public Limited Company."]]},
{id:"liability",cat:"Risk & Liability",title:"How important is personal asset protection?",desc:"The source differentiates structures sharply on limited versus unlimited liability.",opts:[["critical","Critical — personal assets should generally be protected","Limited liability is a core requirement."],["preferred","Preferred but flexibility matters","Limited liability is important, but other factors also matter."],["acceptable","Unlimited liability is acceptable","I understand and accept personal exposure."]]},
{id:"funding",cat:"Funding",title:"What is your expected funding strategy?",desc:"The source identifies substantial differences between share-based structures and partner/proprietor structures.",opts:[["vc","VC / angel / institutional equity","External investors, dilution and equity fundraising."],["bank","Bank finance / debt / self-funded","No immediate equity-investor requirement."],["public","Public issue / eventual listing","Broader public-market capital access."]]},
{id:"compliance",cat:"Compliance Capacity",title:"How much compliance infrastructure can you maintain?",desc:"This measures whether the business can support the recurring governance burden described in the source.",opts:[["low","Low","Prefer the simplest possible compliance structure."],["moderate","Moderate","Can manage regular tax and statutory filings."],["high","High","Can maintain corporate records, audits, meetings and annual filings."]]},
{id:"business",cat:"Business Model",title:"Which business model best describes you?",desc:"Different structures in the source are associated with different business profiles.",opts:[["startup","Startup / scalable growth","Growth, investment, ownership transfer and scale matter."],["professional","Professional / consultancy / service","Partner-driven expertise and flexible profit sharing."],["small","Small local / trading / owner-managed","Direct control and lower administrative burden."]]},
{id:"ownership",cat:"Ownership Structure",title:"How should ownership legally be represented?",desc:"This is a critical routing question. A company limited by shares uses share capital. An LLP does not issue ordinary company shares; partner rights arise through contribution and the LLP Agreement.",opts:[["shares","Share-capital / shareholding ownership","Ownership should be represented through shares, shareholding percentages and share capital."],["partners","Partner contribution / LLP Agreement (no company shares)","Ownership should be represented through partner contribution and agreed partner rights — not company shares."],["single","Direct single-owner control","One person should own and control the business directly."]]},
{id:"scale",cat:"Growth",title:"What is your expected scale?",desc:"Expected growth direction affects the value of funding and governance flexibility.",opts:[["small","Remain small / closely held","No major expansion expected."],["growth","Growth / expansion","Expect more customers, employees, capital or owners."],["large","Large / public-market oriented","Long-term public capital or listing possibility."]]},
{id:"turnover",cat:"Financial Scale",title:"What is your expected annual turnover?",desc:"Turnover is relevant for GST and audit analysis in the source.",opts:[["under20","Below ₹20 lakh","Early-stage / small turnover."],["20to40","₹20 lakh – ₹40 lakh","GST and audit analysis may depend on business type and other conditions."],["40plus","Above ₹40 lakh","Relevant for GST and certain LLP audit thresholds."]]},
{id:"employees",cat:"Employees",title:"Will you employ staff?",desc:"Employee registrations such as EPF and ESI are identified in the source as threshold / applicability-based.",opts:[["none","No employees initially","Founder / partner driven operation."],["small","Small team","Employees but initially a small workforce."],["large","Growing workforce","Employee-related registrations should be actively planned."]]},
{id:"activity",cat:"Industry",title:"Does your activity trigger specialised registrations?",desc:"This identifies whether the business may need additional licences beyond entity registration.",opts:[["general","General commercial / professional activity","No specialised licence currently identified."],["food","Food business","FSSAI becomes relevant."],["import","Import / export","IEC becomes relevant."],["regulated","Regulated / sector-specific activity","Additional regulatory approval may be required."]]},
{id:"foreign",cat:"Foreign / Cross-border",title:"Is foreign investment or foreign contribution contemplated?",desc:"The source discusses FDI and, for Section 8, FCRA considerations.",opts:[["none","No","Domestic ownership / funding only."],["investment","Foreign investment","Foreign investor / FDI possibility."],["contribution","Foreign contribution / donation","Particularly relevant to non-profit organisations."]]}
];

let state={i:0,answers:{},scores:{},rec:null,docs:{}};

function score(a){
  /*
    RELIABILITY-FIRST DECISION ENGINE
    ---------------------------------
    The engine uses HARD COMPATIBILITY GATES before weighted preferences.
    This prevents a structurally incompatible entity from winning merely
    because several softer preferences add points.

    Critical examples:
    1. "Share-capital / shareholding ownership" is compatible with share-capital companies
       (Private Limited / Public Limited / OPC), NOT LLP or Partnership.
    2. "Partner contribution / LLP Agreement (no company shares)" strongly routes to LLP /
       Partnership and removes company-share structures from consideration.
    3. Non-profit objective strongly routes to Section 8.
    4. Public-market funding requires the public-company route, subject to
       the statutory minimum-member/director requirements.
  */
  const s={private_limited:0,llp:0,sole:0,partnership:0,opc:0,public_limited:0,section8:0};
  const impossible=new Set();

  // ---------- HARD STRUCTURAL GATES ----------
  if(a.objective==="nonprofit"){
    // Non-profit objective: Section 8 is the only entity in this engine.
    ["private_limited","llp","sole","partnership","opc","public_limited"].forEach(k=>impossible.add(k));
  } else if(a.objective==="profit"){
    // Profit motive: Section 8 is not a commercial-profit alternative.
    impossible.add("section8");
  }

  if(a.ownership==="shares"){
    // LLP and partnership are NOT share-capital structures.
    impossible.add("llp"); impossible.add("partnership");
    // Direct proprietorship is not share-based.
    impossible.add("sole");
  }

  if(a.ownership==="partners"){
    // Partner contribution / agreement is not company shareholding.
    impossible.add("private_limited"); impossible.add("public_limited");
    impossible.add("opc"); impossible.add("sole");
  }

  if(a.ownership==="single"){
    // Direct single-owner control excludes multi-owner partnership/company
    // structures unless OPC is selected.
    impossible.add("private_limited"); impossible.add("public_limited");
    impossible.add("llp"); impossible.add("partnership");
  }

  if(a.funding==="public"){
    // Public issue / listing is not routed to LLP, partnership, proprietorship
    // or OPC. A public company also requires the relevant statutory structure.
    ["llp","partnership","sole","opc"].forEach(k=>impossible.add(k));
  }

  if(a.funding==="vc"){
    // The supplied business model treats Private Limited as the principal
    // equity/VC/angel route. Other structures are not permitted to outrank it
    // merely through soft scoring.
    ["llp","partnership","sole","opc"].forEach(k=>impossible.add(k));
  }


  // ---------- BASE PREFERENCE SCORING ----------
  if(a.objective==="nonprofit") s.section8+=1000;

  if(a.founders==="one"){s.sole+=180;s.opc+=180;s.private_limited+=15}
  if(a.founders==="two_to_six"){s.private_limited+=75;s.llp+=90;s.partnership+=90}
  if(a.founders==="seven_plus"){
    // Seven or more members does NOT by itself make the company public.
    s.private_limited+=70;
  }

  if(a.liability==="critical"){
    ["private_limited","llp","opc","public_limited","section8"].forEach(k=>s[k]+=75);
    s.sole-=120;s.partnership-=120;
  }
  if(a.liability==="preferred"){
    ["private_limited","llp","opc","public_limited","section8"].forEach(k=>s[k]+=45);
  }
  if(a.liability==="acceptable"){s.sole+=70;s.partnership+=60}

  if(a.funding==="vc") s.private_limited+=500;
  if(a.funding==="public") s.public_limited+=500;
  if(a.funding==="bank"){s.llp+=20;s.partnership+=20;s.sole+=20;s.private_limited+=25}

  if(a.compliance==="low"){
    s.sole+=90;s.partnership+=35;s.llp+=25;
    s.private_limited-=60;s.public_limited-=100;s.section8-=50;
  }
  if(a.compliance==="moderate"){s.llp+=50;s.partnership+=45;s.opc+=30;s.private_limited+=20}
  if(a.compliance==="high"){s.private_limited+=45;s.public_limited+=75;s.section8+=45}

  if(a.business==="startup") s.private_limited+=100;
  if(a.business==="professional"){s.llp+=100;s.partnership+=75}
  if(a.business==="small"){s.sole+=90;s.partnership+=40}

  if(a.ownership==="shares"){
    s.private_limited+=260;s.public_limited+=260;s.opc+=170;
  }
  if(a.ownership==="partners"){
    s.llp+=280;s.partnership+=260;
  }
  if(a.ownership==="single"){
    s.sole+=180;s.opc+=180;
  }

  if(a.scale==="small"){s.sole+=40;s.partnership+=30;s.llp+=20}
  if(a.scale==="growth"){s.private_limited+=80;s.llp+=30}
  if(a.scale==="large"){
    // Large scale can still be privately held; do not infer public status from scale alone.
    s.private_limited+=70;
  }

  if(a.foreign==="investment"){s.private_limited+=35;s.llp+=15}
  if(a.foreign==="contribution")s.section8+=150;

  // ---------- SECONDARY BUSINESS RULES ----------
  if(a.founders==="one" && a.ownership==="shares") {
    // A one-person shareholding preference points to OPC rather than LLP.
    s.opc+=260; s.private_limited+=40;
  }
  if(a.founders==="one" && a.ownership==="single" && a.liability==="acceptable"){
    s.sole+=260;
  }
  if(a.founders==="two_to_six" && a.ownership==="partners" && a.liability!=="acceptable"){
    s.llp+=180;
  }
  if(a.founders==="two_to_six" && a.ownership==="partners" && a.liability==="acceptable"){
    s.partnership+=180;
  }

  // ---------- APPLY HARD GATES ----------
  impossible.forEach(k=>{s[k]=-1000000});

  // Never allow an impossible structure to become the recommendation.
  return s;
}
function recommendation(){
  const entries=Object.entries(state.scores)
    .filter(([k,v])=>Number.isFinite(v) && v>-999999)
    .sort((a,b)=>b[1]-a[1]);
  if(!entries.length){
    return {
      key:null,
      fit:0,
      ranking:[],
      conflict:true,
      message:"The selected requirements are structurally incompatible. Review the ownership and funding choices before implementation."
    };
  }
  const top=entries[0],second=entries[1]||[top[0],top[1]];
  const gap=Math.max(0,top[1]-second[1]);
  const fit=Math.max(78,Math.min(98,Math.round(78+Math.min(20,gap/10))));
  return {key:top[0],fit,ranking:entries,conflict:false};
}
function drivers(a,k){
  const x=[];
  if(a.objective==="nonprofit")x.push("The non-profit objective routes the assessment to the Section 8 framework.");
  if(a.ownership==="shares")x.push("Share-capital / shareholding ownership is a company share-capital requirement; LLP and Partnership are excluded from the recommendation set.");
  if(a.ownership==="partners")x.push("Partner contribution and LLP-Agreement based ownership routes toward LLP / Partnership rather than a share-capital company.");
  if(a.funding==="vc"&&k==="private_limited")x.push("VC / angel / institutional equity funding is a direct structural driver toward a Private Limited Company.");
  if(a.funding==="public"&&k==="public_limited")x.push("Public-market capital objectives route toward a Public Limited Company, subject to statutory eligibility.");
  if(a.founders==="one"&&k==="opc")x.push("One founder plus share-based limited-liability preference is aligned with the OPC structure.");
  if(a.founders==="one"&&k==="sole")x.push("One owner plus acceptance of unlimited liability is aligned with proprietorship.");
  if(a.founders==="two_to_six"&&k==="llp")x.push("Multiple founders plus partner-style ownership and limited liability support an LLP.");
  if(a.founders==="two_to_six"&&k==="partnership")x.push("Multiple founders plus partner-style ownership and acceptance of unlimited liability support a Partnership Firm.");
  if(a.founders==="seven_plus"&&k==="private_limited")x.push("Seven or more members can still fit a Private Limited Company; member count alone does not route the result to a Public Limited Company.");
  if(a.liability==="critical")x.push("Personal asset protection is a core decision criterion in the assessment.");
  if(a.compliance==="low")x.push("Low compliance capacity reduces suitability of structures with heavier corporate governance.");
  return x.length?x.slice(0,5):["The result reflects the combined structural answers and the hard-compatibility rules of the engine."];
}
function alternativeStructures(a,k){
  /*
    Alternatives are filtered for legal/structural compatibility.
    This avoids showing LLP as an "alternative" where the user explicitly
    selected share-based ownership, and avoids presenting structurally
    incompatible forms as credible recommendations.
  */
  const blocked=new Set();
  if(a.ownership==="shares"){blocked.add("llp");blocked.add("partnership");blocked.add("sole")}
  if(a.ownership==="partners"){blocked.add("private_limited");blocked.add("public_limited");blocked.add("opc");blocked.add("sole")}
  if(a.ownership==="single"){blocked.add("private_limited");blocked.add("public_limited");blocked.add("llp");blocked.add("partnership")}
  if(a.funding==="vc")["llp","partnership","sole","opc"].forEach(k=>blocked.add(k));
  if(a.funding==="public")["llp","partnership","sole","opc"].forEach(k=>blocked.add(k));
  if(a.objective==="nonprofit")["private_limited","llp","sole","partnership","opc","public_limited"].forEach(k=>blocked.add(k));
  if(a.objective==="profit")blocked.add("section8");
  return state.rec.ranking.filter(([key])=>key!==k && !blocked.has(key)).slice(0,3);
}
function optionLabel(q,v){const o=q.opts.find(x=>x[0]===v);return o?o[1]:"—"}



function renderQuestion(){
 const q=QUESTIONS[state.i],selected=state.answers[q.id],pct=((state.i+1)/QUESTIONS.length)*100;
 document.getElementById("qCount").textContent=`Question ${state.i+1} of ${QUESTIONS.length}`;
 document.getElementById("qCat").textContent=q.cat;
 document.getElementById("qProgress").style.width=pct+"%";
 document.getElementById("question").innerHTML=`
   <h2 class="q-title">${q.title}</h2>
   <p class="q-desc">${q.desc}</p>
   <div class="options">${q.opts.map(o=>`
     <label class="option ${selected===o[0]?'selected':''}">
       <input type="radio" name="${q.id}" value="${o[0]}" style="display:none" ${selected===o[0]?'checked':''}>
       <span class="dot"></span>
       <span><div class="option-title">${o[1]}</div><div class="option-detail">${o[2]}</div></span>
     </label>`).join("")}</div>`;
 document.querySelectorAll(".option").forEach(card=>card.addEventListener("click",()=>{
   const input=card.querySelector("input");state.answers[q.id]=input.value;
   document.querySelectorAll(`input[name="${q.id}"]`).forEach(x=>x.closest(".option").classList.remove("selected"));
   input.checked=true;card.classList.add("selected");
 }));
 document.getElementById("prevQ").disabled=state.i===0;
 document.getElementById("nextQ").textContent=state.i===QUESTIONS.length-1?"Generate Intelligence Dashboard →":"Continue →";
}
document.getElementById("prevQ").onclick=()=>{if(state.i>0){state.i--;renderQuestion()}};
document.getElementById("nextQ").onclick=()=>{
 if(!state.answers[QUESTIONS[state.i].id]){alert("Please select an option before continuing.");return}
 if(state.i<QUESTIONS.length-1){state.i++;renderQuestion();window.scrollTo({top:0,behavior:"smooth"})}
 else{generate()}
};

function metricCards(e){
 const items=[
 ["Liability",e.liability,"shield"],["Compliance",e.compliance,"calendar"],["Funding",e.funding.split(".")[0],"target"],["Audit",e.audit,"file"],
 ["Legal Identity",e.legal,"shield"],["Members",e.members,"grid"],["Ownership",e.ownership,"compare"],["Priority",priority(state.rec.key),"route"]
 ];
 document.getElementById("metrics").innerHTML=items.map(x=>`
 <div class="card metric"><div class="ico" style="width:22px;height:22px">${ICONS[x[2]]}</div><div class="metric-label">${x[0]}</div><div class="metric-value">${x[1]}</div></div>`).join("");
}
function priority(k){return {private_limited:"Incorporation",llp:"LLP Agreement",sole:"Core registrations",partnership:"Partnership Deed",opc:"OPC incorporation",public_limited:"Corporate incorporation",section8:"Section 8 licence"}[k]}

function renderDashboard(){
 const e=ENTITIES[state.rec.key],a=state.answers;
 document.getElementById("heroTitle").textContent=e.name;
 document.getElementById("heroDesc").textContent=e.best+". "+e.legal+". "+e.liability+".";
 document.getElementById("recTitle").textContent=e.name;
 document.getElementById("recDesc").textContent=e.name+" is the current structural fit based on your stated ownership, liability, funding, compliance and growth requirements.";
 document.getElementById("score").textContent=state.rec.fit;
 const ring=2*Math.PI*78;document.getElementById("ringFg").style.strokeDashoffset=ring-(state.rec.fit/100)*ring;
 document.getElementById("recPills").innerHTML=`<span class="pill green">● Current fit ${state.rec.fit}/100</span><span class="pill blue">FY 2026–27</span><span class="pill gray">${e.compliance} compliance</span>`;
 document.getElementById("drivers").innerHTML=drivers(a,state.rec.key).map((x,i)=>`<div class="driver"><div class="driver-num">${i+1}</div><div class="driver-text">${x}</div></div>`).join("");
 // Risk / change sections were intentionally removed from the dashboard UI.
 // Do not write to those retired DOM nodes; doing so prevents the dashboard
 // from rendering after the final questionnaire step.
 metricCards(e);
 document.getElementById("executive").textContent=`Based on the answers provided, the engine identifies ${e.name} as the current structural fit. The assessment considers the organisation's objective, founder count, liability preference, funding strategy, compliance capacity, ownership model and expected scale. The source positions this structure for ${e.best.toLowerCase()}.`;
 document.getElementById("overviewCards").innerHTML=[
 ["Ownership model",e.ownership],["Funding compatibility",e.funding],["Tax position",e.tax],["Audit position",e.audit]
 ].map(x=>`<div class="card text-card"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join("");
 document.getElementById("answers").innerHTML=QUESTIONS.map(q=>`<div class="answer-item"><div class="answer-cat">${q.cat}</div><div class="answer-val">${optionLabel(q,a[q.id])}</div></div>`).join("");
 renderAnalysis(e);renderDocs(e);renderCompliance(e);renderRegs(a);renderMatrix();renderAction(e);
 buildPrint(e);
 document.getElementById("assessment").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderAnalysis(e){
 const blocks=[
 ["Structural compatibility gate", state.answers.ownership==="shares" ? "Share-capital ownership selected: LLP and Partnership are excluded because they are partner/contribution-based structures, not ordinary share-capital companies." : state.answers.ownership==="partners" ? "Partner-contribution ownership selected: share-capital company structures are excluded from the primary recommendation path." : "Direct single-owner control selected: the engine evaluates proprietorship / OPC routes before other forms."],
 ["Legal identity",e.legal],["Liability",e.liability],["Members / ownership",e.members],["Ownership mechanics",e.ownership],
 ["Funding implications",e.funding],["Tax position",e.tax],["Compliance burden",e.compliance],["Audit position",e.audit],["Business suitability",e.best]
 ];
 document.getElementById("analysis").innerHTML=blocks.map((x,i)=>`<div class="analysis-item"><h4>${String(i+1).padStart(2,"0")} • ${x[0]}</h4><p>${x[1]}</p></div>`).join("");
 document.getElementById("alternatives").innerHTML=alternativeStructures(state.answers,state.rec.key).map((x,i)=>{
  const e2=ENTITIES[x[0]];
  return `<div class="alt"><div class="alt-title">${i+1}. ${e2.name}</div><div class="alt-desc"><b>Why it may fit:</b> ${e2.best}</div><div class="alt-desc"><b>Liability:</b> ${e2.liability}</div><div class="alt-desc"><b>Compliance:</b> ${e2.compliance}</div><div class="alt-desc"><b>Funding:</b> ${e2.funding}</div></div>`
}).join("") || `<div class="alt"><div class="alt-title">No structurally compatible alternative</div><div class="alt-desc">The selected requirements create a narrow structural route. Review the current recommendation with a qualified professional before implementation.</div></div>`;
}
function renderDocs(e){
 state.docs={};let html="";
 e.docs.forEach((g,gi)=>{html+=`<div class="card doc-group"><h4>${g[0]}</h4>${g[1].map((item,ii)=>{let id=gi+"_"+ii;state.docs[id]=false;return `<label class="check"><input type="checkbox" data-doc="${id}"><span>${item}</span></label>`}).join("")}</div>`});
 document.getElementById("documents").innerHTML=html;updateDocs();
 document.querySelectorAll("[data-doc]").forEach(x=>x.onchange=()=>{state.docs[x.dataset.doc]=x.checked;x.closest(".check").classList.toggle("done",x.checked);updateDocs()});
}
function updateDocs(){let t=Object.keys(state.docs).length,d=Object.values(state.docs).filter(Boolean).length;document.getElementById("docCount").textContent=`${d} / ${t}`;document.getElementById("docProgress").style.width=(t?d/t*100:0)+"%"}
function renderCompliance(e){
 const f=document.getElementById("compFilter").value;
 const arr=e.comp.filter(x=>f==="all"||x[0]===f);
 document.getElementById("compliance").innerHTML=arr.map((x,i)=>`<div class="time-item"><div class="time-num">${i+1}</div><div class="time-body"><div class="time-top"><div class="time-title">${x[2]}</div><div class="time-type">${x[0]}</div></div><div class="time-date">${x[1]}</div><div class="time-detail">${x[3]}</div></div></div>`).join("");
}
document.getElementById("compFilter").onchange=()=>state.rec&&renderCompliance(ENTITIES[state.rec.key]);

function renderRegs(a){
  /* General registration overview — not restricted to any one state. */
  const regs=[
    ["GST", a.turnover==="40plus"?"Priority review":a.turnover==="20to40"?"Threshold review":"Conditional",
      "Evaluate GST registration based on turnover, supply type and compulsory-registration provisions.",
      "Check aggregate turnover • taxable/exempt supplies • inter-State activity • e-commerce • reverse charge • special categories."],
    ["Professional Tax", "State-specific",
      "Professional Tax may apply depending on the state, nature of activity, profession and employer/employee structure.",
      "Check state rules • professional/employer applicability • employee payroll • registration and payment requirements."],
    ["EPF", a.employees==="none"?"Conditional":"Workforce review",
      "EPF is generally an employee-linked compliance requirement and should be evaluated based on workforce and establishment coverage.",
      "Check employee count • establishment coverage • eligible employees • contractor/workforce arrangements."],
    ["ESI", a.employees==="none"?"Conditional":"Workforce review",
      "ESI applicability depends on employee coverage, establishment/activity and applicable statutory conditions.",
      "Check employee count • wage coverage • establishment/activity • applicable location and coverage rules."],
    ["FSSAI", a.activity==="food"?"Priority review":"Conditional",
      "Food businesses should evaluate the appropriate food registration or licence before commencing relevant activities.",
      "Check food activity • nature of operation • turnover • manufacturing/processing/storage/distribution."],
    ["Udyam / MSME", "Eligibility review",
      "Udyam is an MSME registration/classification layer and does not replace entity formation, GST or sector licences.",
      "Check enterprise classification • investment/turnover criteria • PAN/GST linkage where applicable."],
    ["Shop & Establishment", "State / local review",
      "Registration or intimation may apply depending on the state/local framework, establishment type, activity and workforce.",
      "Check location • establishment type • activity • employee count • registration/intimation requirements."],
    ["IEC", a.activity==="import"?"Priority review":"Conditional",
      "Import Export Code should be evaluated where the business undertakes import/export activity covered by the foreign-trade framework.",
      "Check import/export activity • entity/PAN details • bank account • product-specific permissions."],
    ["Sector-specific licences", a.activity==="regulated"?"Priority review":"Conditional",
      "Regulated activities may require additional approvals beyond incorporation and tax registrations.",
      "Check sector • product/service • premises • environmental/fire/labour requirements • competent regulator." ]
  ];
  document.getElementById("registrations").innerHTML=regs.map(r=>`
    <div class="card reg">
      <div class="reg-top"><h4>${r[0]}</h4><span class="pill ${r[1].includes("Priority")?"red":r[1].includes("review")||r[1].includes("Workforce")?"amber":"blue"}">${r[1]}</span></div>
      <p>${r[2]}</p>
      <div class="reg-next"><b>Applicability checklist</b>${r[3]}</div>
    </div>`).join("");
}
function renderMatrix(){
 const cols=["Parameter","Private Limited","LLP","Proprietorship","Partnership","OPC","Public Limited","Section 8"];
 const rows=[
 ["Legal Status","Separate legal entity","Separate legal entity","No separate legal identity","No separate legal entity","Separate legal entity","Separate legal entity","Separate legal entity"],
 ["Liability","Limited","Limited, subject to exceptions","Unlimited","Unlimited joint & several","Limited","Limited","Limited"],
 ["Minimum Members","2 shareholders + 2 directors","2 partners","1 proprietor","2 partners","1 member + nominee","7 members + 3 directors","2 members + 2 directors"],
 ["Compliance","High","Moderate","Lowest","Moderate","Moderate","Very High","High"],
 ["Audit","Mandatory","Threshold based","Threshold based","Threshold based","Mandatory","Corporate audit","Mandatory"],
 ["Funding","Equity / VC / Angel / PE","Contribution / loans","Owner / loans","Partner contribution / loans","Limited investor appeal","Public capital routes","Donations / grants / CSR / applicable foreign contribution"],
 ["Tax","22% / 25% / 30% as source states","30% + surcharge + cess","Individual tax framework","30% + surcharge + cess","Domestic company framework","Not separately specified in source","12AB / 80G subject to conditions"],
 ["Typical Suitability","Startups / scale-ups / funded","Professional / service / bootstrapped","Solo / local / small","Small / family / professional","Solo corporate entrepreneur","Broader capital / public-market scale","Non-profit / charitable / social"]
 ];
 document.getElementById("matrixHead").innerHTML="<tr>"+cols.map(x=>`<th>${x}</th>`).join("")+"</tr>";
 document.getElementById("matrixBody").innerHTML=rows.map(r=>"<tr>"+r.map(x=>`<td>${x}</td>`).join("")+"</tr>").join("");
}
function renderAction(e){
 const items=[
 ["Confirm the structural decision",`Review the ${e.name} recommendation against founder, liability, funding and compliance requirements.`],
 ["Prepare incorporation documents","Complete the entity-specific document checklist shown in the Document Control Room."],
 ["Complete core registration",coreAction(state.rec.key)],
 ["Set up accounting & compliance controls","Create books of account, filing ownership, document storage and deadline tracking from day one."],
 ["Complete ancillary registrations","Evaluate GST, Professional Tax, EPF/ESI, FSSAI, Udyam, Shop & Establishment, IEC and other activity/state-specific registrations."],
 ["Activate the compliance calendar","Track annual, tax, audit and event-based obligations identified in the entity-specific calendar."]
 ];
 document.getElementById("actionPlan").innerHTML=items.map((x,i)=>`<div class="action"><div class="action-num">${String(i+1).padStart(2,"0")}</div><div><h4>${x[0]}</h4><p>${x[1]}</p></div></div>`).join("");
}
function coreAction(k){
 return {private_limited:"Proceed through the applicable company incorporation workflow including DSC, name reservation, SPICe+ and constitutional documents.",llp:"Complete DSC, name reservation, incorporation and LLP Agreement/Form 3.",sole:"Establish the proprietorship through the applicable business registrations and banking setup.",partnership:"Prepare the Partnership Deed, registration statement and applicable Registrar of Firms documentation.",opc:"Complete OPC incorporation documentation including nominee consent and applicable incorporation filings.",public_limited:"Complete public-company incorporation with required members, directors, DSC, DIN and constitutional documents.",section8:"Complete Section 8 incorporation and licence documentation including required constitutional declarations."}[k]
}

/* TABS / NAV */
function activateTab(tab){
 document.querySelectorAll(".tab,.nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
 document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden"));
 document.getElementById("panel-"+tab).classList.remove("hidden");
 if(window.innerWidth<901)document.getElementById("sidebar").classList.remove("open");
 document.getElementById("workspace").scrollIntoView({behavior:"smooth",block:"nearest"});
}
document.querySelectorAll("[data-tab]").forEach(x=>x.addEventListener("click",()=>activateTab(x.dataset.tab)));
document.querySelectorAll("[data-jump]").forEach(x=>x.addEventListener("click",()=>activateTab(x.dataset.jump)));
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");

/* NEW */
document.getElementById("newBtn").onclick=()=>{if(confirm("Start a new assessment? The current assessment will be cleared.")){state={i:0,answers:{},scores:{},rec:null,docs:{}};document.getElementById("dashboard").classList.add("hidden");document.getElementById("assessment").classList.remove("hidden");renderQuestion();window.scrollTo({top:0,behavior:"smooth"})}};

/* PRINT REPORT */
function buildPrint(e){
 const a=state.answers;
 const drv=drivers(a,state.rec.key);
 const esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 const qById=id=>QUESTIONS.find(q=>q.id===id);
 const answers=QUESTIONS.map(q=>`<div class="pcard"><h4>${esc(q.cat)}</h4><p><b>${esc(optionLabel(q,a[q.id]))}</b></p><div class="print-small">${esc(q.title)}</div></div>`).join("");
 const docs=e.docs.map(g=>`<div class="pcard"><h4>${esc(g[0])}</h4><ul>${g[1].map(x=>`<li>☐ ${esc(x)}</li>`).join("")}</ul></div>`).join("");
 const comp=e.comp.map((x,i)=>`<tr><td>${i+1}. ${esc(x[2])}</td><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td>${esc(x[3])}</td></tr>`).join("");
 const regs=[
  ["GST", a.turnover==="40plus"?"Priority review":a.turnover==="20to40"?"Threshold review":"Conditional", "Evaluate GST registration based on turnover, supply type and compulsory-registration provisions.", "Check aggregate turnover • taxable/exempt supplies • inter-State activity • e-commerce • reverse charge • special categories."],
  ["Professional Tax", "State-specific", "Professional Tax may apply depending on the state, nature of activity, profession and employer/employee structure.", "Check state rules • professional/employer applicability • employee payroll • registration and payment requirements."],
  ["EPF", a.employees==="none"?"Conditional":"Workforce review", "EPF is generally an employee-linked compliance requirement and should be evaluated based on workforce and establishment coverage.", "Check employee count • establishment coverage • eligible employees • contractor/workforce arrangements."],
  ["ESI", a.employees==="none"?"Conditional":"Workforce review", "ESI applicability depends on employee coverage, establishment/activity and applicable statutory conditions.", "Check employee count • wage coverage • establishment/activity • applicable location and coverage rules."],
  ["FSSAI", a.activity==="food"?"Priority review":"Conditional", "Food businesses should evaluate the appropriate food registration or licence before commencing relevant activities.", "Check food activity • nature of operation • turnover • manufacturing/processing/storage/distribution."],
  ["Udyam / MSME", "Eligibility review", "Udyam is an MSME registration/classification layer and does not replace entity formation, GST or sector licences.", "Check enterprise classification • investment/turnover criteria • PAN/GST linkage where applicable."],
  ["Shop & Establishment", "State / local review", "Registration or intimation may apply depending on the state/local framework, establishment type, activity and workforce.", "Check location • establishment type • activity • employee count • registration/intimation requirements."],
  ["IEC", a.activity==="import"?"Priority review":"Conditional", "Import Export Code should be evaluated where the business undertakes import/export activity covered by the foreign-trade framework.", "Check import/export activity • entity/PAN details • bank account • product-specific permissions."],
  ["Sector-specific licences", a.activity==="regulated"?"Priority review":"Conditional", "Regulated activities may require additional approvals beyond incorporation and tax registrations.", "Check sector • product/service • premises • environmental/fire/labour requirements • competent regulator."]
 ];
 const registrationCards=regs.map(r=>`<div class="pcard"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h4>${esc(r[0])}</h4><span class="print-badge">${esc(r[1])}</span></div><p>${esc(r[2])}</p><div class="print-check"><b>Applicability checklist</b><br>${esc(r[3])}</div></div>`).join("");
 const analysisBlocks=[
  ["Structural compatibility gate", a.ownership==="shares" ? "Share-capital ownership selected: LLP and Partnership are excluded because they are partner/contribution-based structures, not ordinary share-capital companies." : a.ownership==="partners" ? "Partner-contribution ownership selected: share-capital company structures are excluded from the primary recommendation path." : "Direct single-owner control selected: the engine evaluates proprietorship / OPC routes before other forms."],
  ["Legal identity",e.legal],["Liability",e.liability],["Members / ownership",e.members],["Ownership mechanics",e.ownership],["Funding implications",e.funding],["Tax position",e.tax],["Compliance burden",e.compliance],["Audit position",e.audit],["Business suitability",e.best]
 ];
 const analysis=analysisBlocks.map((x,i)=>`<div class="pcard"><h4>${String(i+1).padStart(2,"0")} • ${esc(x[0])}</h4><p>${esc(x[1])}</p></div>`).join("");
 const alts=alternativeStructures(a,state.rec.key);
 const alternatives=alts.map((x,i)=>{const e2=ENTITIES[x[0]];return `<div class="pcard"><h4>Alternative ${i+1}: ${esc(e2.name)}</h4><p><b>Why it may fit:</b> ${esc(e2.best)}</p><p><b>Liability:</b> ${esc(e2.liability)}</p><p><b>Compliance:</b> ${esc(e2.compliance)}</p><p><b>Funding:</b> ${esc(e2.funding)}</p></div>`}).join("") || `<div class="pcard"><h4>No structurally compatible alternative</h4><p>The selected requirements create a narrow structural route. Review the current recommendation with a qualified professional before implementation.</p></div>`;
 const overview=[ ["Ownership model",e.ownership],["Funding compatibility",e.funding],["Tax position",e.tax],["Audit position",e.audit] ];
 const metrics=[["Liability",e.liability],["Compliance",e.compliance],["Funding",e.funding.split(".")[0]],["Audit",e.audit],["Legal Identity",e.legal],["Members",e.members],["Ownership",e.ownership],["Priority",priority(state.rec.key)]];
 const matrixRows=[
  ["Legal Status","Separate legal entity","Separate legal entity","No separate legal identity","No separate legal entity","Separate legal entity","Separate legal entity","Separate legal entity"],
  ["Liability","Limited","Limited, subject to exceptions","Unlimited","Unlimited joint & several","Limited","Limited","Limited"],
  ["Minimum Members","2 shareholders + 2 directors","2 partners","1 proprietor","2 partners","1 member + nominee","7 members + 3 directors","2 members + 2 directors"],
  ["Compliance","High","Moderate","Lowest","Moderate","Moderate","Very High","High"],
  ["Audit","Mandatory","Threshold based","Threshold based","Threshold based","Mandatory","Corporate audit","Mandatory"],
  ["Funding","Equity / VC / Angel / PE","Contribution / loans","Owner / loans","Partner contribution / loans","Limited investor appeal","Public capital routes","Donations / grants / CSR / applicable foreign contribution"],
  ["Tax","22% / 25% / 30% as source states","30% + surcharge + cess","Individual tax framework","30% + surcharge + cess","Domestic company framework","Not separately specified in source","12AB / 80G subject to conditions"],
  ["Typical Suitability","Startups / scale-ups / funded","Professional / service / bootstrapped","Solo / local / small","Small / family / professional","Solo corporate entrepreneur","Broader capital / public-market scale","Non-profit / charitable / social"]
 ];
 const action=[
  ["Confirm the structural decision",`Review the ${e.name} recommendation against founder, liability, funding and compliance requirements.`],
  ["Prepare incorporation documents","Complete the entity-specific document checklist shown in the Document Control Room."],
  ["Complete core registration",coreAction(state.rec.key)],
  ["Set up accounting & compliance controls","Create books of account, filing ownership, document storage and deadline tracking from day one."],
  ["Complete ancillary registrations","Evaluate GST, Professional Tax, EPF/ESI, FSSAI, Udyam, Shop & Establishment, IEC and other activity/state-specific registrations."],
  ["Activate the compliance calendar","Track annual, tax, audit and event-based obligations identified in the entity-specific calendar."]
 ];
 const disclaimer="Preliminary decision support only. Verify current law, thresholds, state/local rules and activity-specific requirements before implementation. This report is not legal, tax, accounting, secretarial or regulatory advice, and final responsibility for the structure, registrations, filings and compliance remains with the user.";
 document.getElementById("printReport").innerHTML=`
 <div class="print-page print-cover">
  <div>
   <div class="print-brand"><div class="print-mark">BI</div><div><b>Business Structure Intelligence</b><div style="font-size:7px;color:#64748b">Decision & Compliance Engine</div></div></div>
   <div class="print-title">${esc(e.name)}</div>
   <div class="print-sub">${esc(e.best)}</div>
   <div class="print-kpis">${metrics.slice(0,4).map(x=>`<div class="pkpi"><div class="pkpi-label">${esc(x[0])}</div><div class="pkpi-value">${esc(x[1])}</div></div>`).join("")}</div>
   <div class="pcard" style="margin-top:18px"><h4>Executive Decision</h4><p>Based on the answers provided, the engine identifies <b>${esc(e.name)}</b> as the current structural fit. The assessment considers objective, founder count, liability preference, funding strategy, compliance capacity, ownership model and expected scale.</p></div>
   <div class="pcard" style="margin-top:9px;background:#fffaf0"><h4>Important limitation</h4><p>${esc(disclaimer)}</p></div>
  </div>
  <div class="print-foot">Assessment period: FY 2026–27 • Generated from the current browser session • Business Structure Intelligence</div>
 </div>

 <div class="print-page"><div class="print-section-title">1. Decision Dashboard Summary</div>
  <div class="print-grid2">${metrics.map(x=>`<div class="pcard"><h4>${esc(x[0])}</h4><p>${esc(x[1])}</p></div>`).join("")}</div>
  <div class="pcard" style="margin-top:10px"><h4>Recommendation</h4><p><b>${esc(e.name)}</b> is the current structural fit based on your stated ownership, liability, funding, compliance and growth requirements.</p></div>
  <div class="pcard" style="margin-top:10px"><h4>Decision Drivers</h4>${drv.map((x,i)=>`<p><b>${i+1}.</b> ${esc(x)}</p>`).join("")}</div>
  <div class="pcard" style="margin-top:10px"><h4>Executive Summary</h4><p>Based on the answers provided, the engine identifies ${esc(e.name)} as the current structural fit. The source positions this structure for ${esc(e.best.toLowerCase())}.</p></div>
  <div class="print-grid2" style="margin-top:10px">${overview.map(x=>`<div class="pcard"><h4>${esc(x[0])}</h4><p>${esc(x[1])}</p></div>`).join("")}</div>
 </div>

 <div class="print-page"><div class="print-section-title">2. Assessment Inputs</div><div class="print-grid2">${answers}</div></div>

 <div class="print-page"><div class="print-section-title">3. Detailed Analysis</div><div class="print-grid2">${analysis}</div></div>

 <div class="print-page"><div class="print-section-title">4. Structurally Compatible Alternatives</div>${alternatives}</div>

 <div class="print-page"><div class="print-section-title">5. Incorporation Document Control</div><div class="print-grid2">${docs}</div></div>

 <div class="print-page"><div class="print-section-title">6. FY 2026–27 Compliance Calendar</div><table class="print-table"><thead><tr><th>Category</th><th>Frequency / Type</th><th>Obligation</th><th>Details</th></tr></thead><tbody>${comp}</tbody></table></div>

 <div class="print-page"><div class="print-section-title">7. Registration & Licensing Overview</div><div class="print-grid2">${registrationCards}</div></div>

 <div class="print-page"><div class="print-section-title">8. Business Structure Comparison Matrix</div><table class="print-table"><thead><tr>${["Parameter","Private Limited","LLP","Proprietorship","Partnership","OPC","Public Limited","Section 8"].map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${matrixRows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>

 <div class="print-page"><div class="print-section-title">9. Recommended Execution Plan</div>${action.map((x,i)=>`<div class="pcard" style="margin-bottom:8px"><h4>Step ${i+1} • ${esc(x[0])}</h4><p>${esc(x[1])}</p></div>`).join("")}<div class="pcard" style="margin-top:12px;background:#fffaf0"><h4>Important limitation</h4><p>${esc(disclaimer)}</p></div><div class="print-foot">End of report • Verify the latest applicable legal and regulatory requirements before implementation.</div></div>`;
}
document.getElementById("printBtn").onclick=()=>window.print();



function renderConflict(){
  const a=state.answers;
  document.getElementById("heroTitle").textContent="Compatibility Check Required";
  document.getElementById("heroDesc").textContent="The selected answers do not produce a legally compatible structure in the current decision set. No structure has been recommended.";
  document.getElementById("recTitle").textContent="No compatible structure identified";
  document.getElementById("recDesc").textContent="Review the answers below. In particular, check whether the ownership model and funding strategy can operate together under the selected structure.";
  document.getElementById("score").textContent="—";
  document.getElementById("ringFg").style.strokeDashoffset=(2*Math.PI*78);
  document.getElementById("recPills").innerHTML='<span class="pill amber">Compatibility review</span><span class="pill gray">No recommendation made</span>';
  document.getElementById("drivers").innerHTML=[
    "Ownership and funding requirements are currently incompatible.",
    a.ownership==="single"&&a.funding==="vc"?"Single-owner control conflicts with a VC / institutional equity funding route because that funding model requires an investor-compatible ownership structure.":"One or more selected structural requirements exclude every available entity in the current decision set.",
    "Change the conflicting answer(s) and regenerate the dashboard."
  ].map((x,i)=>`<div class="driver"><div class="driver-num">${i+1}</div><div class="driver-text">${x}</div></div>`).join("");
  document.getElementById("metrics").innerHTML=[
    ["Status","Review required"],["Recommendation","None"],["Ownership",optionLabel(QUESTIONS.find(q=>q.id==="ownership"),a.ownership)],["Funding",optionLabel(QUESTIONS.find(q=>q.id==="funding"),a.funding)]
  ].map(x=>`<div class="card metric"><div class="metric-label">${x[0]}</div><div class="metric-value">${x[1]}</div></div>`).join("");
  document.getElementById("executive").textContent="No entity has been recommended because the selected requirements do not leave a structurally compatible option. The tool does not force a recommendation when the answers conflict.";
  document.getElementById("overviewCards").innerHTML=[
    ["Ownership selected",optionLabel(QUESTIONS.find(q=>q.id==="ownership"),a.ownership)],
    ["Funding selected",optionLabel(QUESTIONS.find(q=>q.id==="funding"),a.funding)],
    ["Next step","Review the conflicting requirements and regenerate the assessment"]
  ].map(x=>`<div class="card text-card"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join("");
  document.getElementById("answers").innerHTML=QUESTIONS.map(q=>`<div class="answer-item"><div class="answer-cat">${q.cat}</div><div class="answer-val">${optionLabel(q,a[q.id])}</div></div>`).join("");
  document.getElementById("analysis").innerHTML='<div class="analysis-item"><h4>01 • Compatibility result</h4><p>No legally compatible entity was found for the complete combination of answers. The engine intentionally does not select an entity merely to produce a result.</p></div><div class="analysis-item"><h4>02 • What to review</h4><p>Review the ownership representation and funding strategy first. A share-capital investor route generally requires a share-capital company structure rather than direct single-owner control.</p></div>';
  document.getElementById("alternatives").innerHTML='<div class="alt"><div class="alt-title">No alternative shown</div><div class="alt-desc">Alternatives are not displayed because there is no compatible primary structure under the selected requirements.</div></div>';
  document.getElementById("documents").innerHTML='<div class="card text-card"><h3>Document checklist paused</h3><p>Resolve the structural compatibility issue first. Entity-specific documents should not be generated until a compatible structure is selected.</p></div>';
  document.getElementById("compliance").innerHTML='<div class="card text-card"><h3>Compliance calendar paused</h3><p>Entity-specific compliance obligations will be shown after a compatible structure is identified.</p></div>';
  renderRegs(a);
  renderMatrix();
  document.getElementById("actionPlan").innerHTML='<div class="action"><div class="action-num">01</div><div><h4>Review conflicting answers</h4><p>Revisit ownership and funding requirements.</p></div></div><div class="action"><div class="action-num">02</div><div><h4>Regenerate assessment</h4><p>Return to the questionnaire and update the conflicting input.</p></div></div>';
  document.getElementById("assessment").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
function generate(){
  state.scores=score(state.answers);
  state.rec=recommendation();
  if(state.rec.conflict){renderConflict();return;}
  renderDashboard();
}
renderQuestion();
