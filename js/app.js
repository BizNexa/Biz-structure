
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
  "private_limited": {
    "name": "Private Limited Company",
    "legal": "Separate legal entity",
    "liability": "Limited to unpaid share capital",
    "compliance": "High",
    "funding": "Equity, preference shares, CCPS, ESOPs, debentures, VC, angel and PE funding are identified in the source.",
    "ownership": "Shareholders own through shares; Board of Directors manages company affairs.",
    "best": "Startups, scale-ups, funded businesses and businesses expecting outside investors.",
    "docs": [
      [
        "Directors & Shareholders",
        [
          "PAN of directors/shareholders",
          "Aadhaar / identity proof",
          "Recent photographs",
          "Address proof",
          "Email and mobile details",
          "Specimen signature",
          "Class 3 DSC"
        ]
      ]
    ],
    "comp": [
      [
        "Initial",
        "Within 30 days",
        "First Board Meeting",
        "First Board meeting within 30 days of incorporation."
      ],
      [
        "Initial",
        "Within 30 days",
        "First Auditor / ADT-1",
        "Appointment of first auditor and related filing requirements."
      ],
      [
        "Annual",
        "30 Sep 2027 / within 6 months of FY-end",
        "AGM",
        "Conduct the AGM within the statutory period, subject to applicable class-specific exemptions.",
        "Companies other than OPC, subject to statutory exceptions.",
        "Critical — AGM date drives AOC-4 and MGT-7 timelines."
      ],
      [
        "Annual",
        "Within 30 days of AGM",
        "AOC-4",
        "File the annual financial statements with ROC; use the applicable AOC-4 variant/XBRL where required.",
        "Companies filing financial statements; OPC has the separate 180-day timing.",
        "Critical — AGM date and correct filing variant must be controlled."
      ]
    ],
    "docsTotal": 20,
    "compTotal": 13,
    "compCounts": {
      "Initial": 5,
      "Annual": 7,
      "Event Based": 1
    }
  },
  "llp": {
    "name": "Limited Liability Partnership",
    "legal": "Separate legal entity",
    "liability": "Limited to agreed contribution, subject to applicable exceptions",
    "compliance": "Moderate",
    "funding": "Partner contribution and loans; no ordinary equity-share funding route.",
    "ownership": "Partners hold interests through capital contribution and the LLP Agreement.",
    "best": "Professional firms, consultancies, bootstrapped SMEs and service businesses.",
    "docs": [
      [
        "Partners & Designated Partners",
        [
          "PAN",
          "Aadhaar / passport / identity proof",
          "Address proof",
          "Photograph",
          "Class 3 DSC",
          "DIN identification details",
          "Resident designated partner proof"
        ]
      ]
    ],
    "comp": [
      [
        "Initial",
        "Within 30 days",
        "LLP Agreement — Form 3",
        "File the LLP Agreement through the applicable Form 3 process."
      ],
      [
        "Annual",
        "30 May 2027",
        "Form 11 — Annual Return",
        "File the LLP annual return reporting partners, designated partners, contribution and relevant changes.",
        "All LLPs, including dormant/non-operational LLPs.",
        "Critical — cannot be omitted merely because the LLP is inactive."
      ],
      [
        "Tax",
        "Tax Year 2026–27",
        "Firm / LLP income-tax return",
        "Use the form prescribed under the Income-tax Rules, 2026 once notified; due date depends on applicable audit requirements."
      ]
    ],
    "docsTotal": 20,
    "compTotal": 9,
    "compCounts": {
      "Initial": 1,
      "Annual": 3,
      "Tax": 3,
      "Audit": 1,
      "Event Based": 1
    }
  },
  "sole": {
    "name": "Sole Proprietorship",
    "legal": "No separate legal identity from proprietor",
    "liability": "Unlimited personal liability",
    "compliance": "Lowest",
    "funding": "Owner-funded / loans; not an equity-investor structure.",
    "ownership": "Complete direct control by proprietor.",
    "best": "Solo freelancers, small shopkeepers, local traders and small owner-managed businesses.",
    "docs": [
      [
        "Proprietor KYC",
        [
          "PAN",
          "Aadhaar",
          "Government identity proof",
          "Photograph"
        ]
      ],
      [
        "Business Address",
        [
          "Business address proof",
          "Rent agreement where applicable"
        ]
      ]
    ],
    "comp": [
      [
        "Annual",
        "31 Aug 2027 / 31 Oct 2027 where audited",
        "Income-tax return — proprietor",
        "File the Tax Year 2026–27 return using the applicable prescribed form under the Income-tax Rules, 2026.",
        "Proprietor; non-audit business/profession cases normally 31 Aug 2027, audited cases generally 31 Oct 2027.",
        "Critical — use the FY 2026–27 new-law form and audit status."
      ],
      [
        "Tax",
        "Quarterly where applicable",
        "Advance Tax",
        "Quarterly advance tax where applicable."
      ],
      [
        "Audit",
        "Threshold based",
        "Tax Audit",
        "Applicable when prescribed turnover/receipt conditions are crossed."
      ]
    ],
    "docsTotal": 18,
    "compTotal": 9,
    "compCounts": {
      "Annual": 2,
      "Tax": 3,
      "Audit": 1,
      "State": 1,
      "Employees": 1,
      "Event Based": 1
    }
  },
  "partnership": {
    "name": "Partnership Firm",
    "legal": "No separate legal entity",
    "liability": "Unlimited joint and several liability",
    "compliance": "Moderate",
    "funding": "Partner contribution / loans; cannot issue ordinary shares to equity investors.",
    "ownership": "Partners operate according to the Partnership Deed.",
    "best": "Small traders, family businesses and professional partnerships.",
    "docs": [
      [
        "Partner KYC",
        [
          "PAN of partners",
          "Aadhaar / Voter ID / Passport",
          "Residential address proof",
          "Photographs"
        ]
      ],
      [
        "Firm Constitution",
        [
          "Partnership Deed"
        ]
      ]
    ],
    "comp": [
      [
        "Annual",
        "31 Aug 2027 / 31 Oct 2027 where audited",
        "Partnership firm income-tax return",
        "File the Tax Year 2026–27 return under the new-law framework using the prescribed form.",
        "Partnership firms; audited cases generally follow the 31 Oct 2027 return date.",
        "Critical — reconcile deed, partner remuneration/interest and tax-audit status."
      ],
      [
        "Tax",
        "Periodic",
        "GST Returns",
        "Applicable where GST registered."
      ]
    ],
    "docsTotal": 15,
    "compTotal": 7,
    "compCounts": {
      "Annual": 2,
      "Tax": 2,
      "Audit": 1,
      "Records": 1,
      "Employees": 1
    }
  },
  "opc": {
    "name": "One Person Company",
    "legal": "Separate legal entity",
    "liability": "Limited to unpaid share value",
    "compliance": "Moderate",
    "funding": "Limited investor appeal compared with a Private Limited Company.",
    "ownership": "Single member/shareholder with nominee-based succession.",
    "best": "Individual entrepreneurs seeking corporate identity and limited liability.",
    "docs": [
      [
        "Member / Nominee",
        [
          "PAN",
          "Aadhaar / passport",
          "Residential address proof",
          "Photograph",
          "Nominee consent"
        ]
      ],
      [
        "Registered Office",
        [
          "Ownership proof"
        ]
      ]
    ],
    "comp": [
      [
        "Initial",
        "Within 30 days",
        "First Auditor",
        "First auditor appointment."
      ],
      [
        "Annual",
        "180 days from FY-end",
        "AOC-4",
        "File the OPC annual financial statements within 180 days from the financial year-end.",
        "OPC.",
        "Critical — separate OPC timing from other companies."
      ]
    ],
    "docsTotal": 19,
    "compTotal": 8,
    "compCounts": {
      "Initial": 3,
      "Annual": 4,
      "Audit": 1
    }
  },
  "public_limited": {
    "name": "Public Limited Company",
    "legal": "Separate legal entity",
    "liability": "Limited to amount unpaid on shares",
    "compliance": "Very High",
    "funding": "Public issues, rights issues and private placements subject to applicable law.",
    "ownership": "Share-capital / shareholding ownership with broader transferability subject to law and Articles.",
    "best": "Businesses requiring broader capital access and potential public-market funding.",
    "docs": [
      [
        "Shareholders & Directors",
        [
          "Identity proof",
          "PAN",
          "DSC"
        ]
      ]
    ],
    "comp": [
      [
        "Initial",
        "Within 30 days",
        "First Board Meeting",
        "First Board meeting."
      ],
      [
        "Initial",
        "Within 30 days",
        "First Auditor",
        "First auditor appointment."
      ],
      [
        "Annual",
        "As required during FY",
        "Statutory Registers, Minutes & Books",
        "Maintain statutory registers, Board/committee minutes, books and governance records throughout the year.",
        "Public company and applicable corporate classes; listed status adds SEBI/LODR requirements.",
        "High — records should be contemporaneous and reconciled before annual filings."
      ],
      [
        "Annual",
        "30 Sep 2027 / within 6 months of FY-end",
        "AGM",
        "Conduct AGM within the statutory period; complete annual governance actions and approvals.",
        "Public company; listed companies have additional SEBI/LODR calendar obligations.",
        "Critical — AGM date drives annual filing dates."
      ]
    ],
    "docsTotal": 9,
    "compTotal": 12,
    "compCounts": {
      "Initial": 5,
      "Annual": 7
    }
  },
  "section8": {
    "name": "Section 8 Company",
    "legal": "Separate legal entity",
    "liability": "Limited liability",
    "compliance": "High",
    "funding": "Domestic donations, CSR funding, grants and foreign contributions subject to applicable approvals/conditions.",
    "ownership": "Profits cannot be distributed as dividends and must be applied toward stated objects.",
    "best": "Charitable, educational, social welfare, research, sports and environmental initiatives.",
    "docs": [
      [
        "Directors & Members",
        [
          "PAN",
          "Aadhaar / identity proof",
          "Address proof",
          "Photographs",
          "Class 3 DSC"
        ]
      ]
    ],
    "comp": [
      [
        "Initial",
        "Incorporation",
        "Section 8 Licence",
        "Section 8 licence is part of the incorporation framework."
      ],
      [
        "Annual",
        "As required under Companies Act / SS-1",
        "Board Meetings",
        "Hold and document Board meetings according to the applicable company class, exemptions and Secretarial Standard requirements.",
        "Section 8 company, subject to applicable corporate exemptions.",
        "High — maintain minutes and statutory records."
      ],
      [
        "Annual",
        "By 30 Sep 2027 / within 6 months of FY-end",
        "AGM",
        "Conduct the annual general meeting within the statutory period, subject to applicable exemptions.",
        "Section 8 companies, subject to applicable exemptions.",
        "Critical — AGM timing drives annual filing deadlines."
      ]
    ],
    "docsTotal": 17,
    "compTotal": 10,
    "compCounts": {
      "Initial": 1,
      "Annual": 7,
      "Tax": 1,
      "Event Based": 1
    }
  }
};

const QUESTIONS=[
{id:"objective",cat:"Business Objective",title:"What is the main purpose of the business?",desc:"This helps separate normal commercial businesses from non-profit or charitable organisations.",opts:[["profit","For-profit business","The business is intended to earn and distribute commercial profits."],["nonprofit","Non-profit / charitable / social initiative","The organisation will pursue charitable, educational, social, research, sports or similar objectives."]]},
{id:"founders",cat:"Ownership",title:"How many owners will start the business?",desc:"The number of owners helps identify structures that can legally accommodate the ownership model.",opts:[["one","1 owner","Single entrepreneur / owner."],["two_to_six","2–6 owners","Closely held multi-owner business."],["seven_plus","7 or more owners / members","A larger ownership group; this does not by itself require a Public Limited Company."]]},
{id:"liability",cat:"Risk & Liability",title:"Do you want to protect your personal assets?",desc:"Choose how important limited personal liability is to you as the owner or founder.",opts:[["critical","Yes — this is very important","I want a structure that generally separates business liability from my personal assets."],["preferred","Yes — preferably","Asset protection is important, but I also want flexibility and simpler administration."],["acceptable","No — personal liability is acceptable","I understand that some structures can expose my personal assets to business liabilities."]]},
{id:"funding",cat:"Funding",title:"How do you plan to fund the business?",desc:"Funding plans can strongly influence the most suitable legal structure.",opts:[["vc","Investors / equity funding","VC, angel, institutional or other external equity investment."],["bank","Own funds / bank finance / loans","Founder funds, bank finance or debt without an immediate equity-investor requirement."],["public","Public issue / possible listing","Long-term public-market capital or listing is contemplated."]]},
{id:"compliance",cat:"Compliance Capacity",title:"How much compliance can you handle?",desc:"Choose the level of ongoing governance and filing work you are comfortable maintaining.",opts:[["low","Keep it simple","I prefer the lowest practical compliance burden."],["moderate","Regular compliance is fine","I can manage regular tax and statutory filings."],["high","I can manage detailed compliance","I can maintain corporate records, audits, meetings and annual filings."]]},
{id:"business",cat:"Business Model",title:"Which best describes your business?",desc:"The business model helps match the structure to how you expect to operate and grow.",opts:[["startup","Startup / scalable business","Growth, investment, ownership transfer and scale matter."],["professional","Professional / consultancy / service","Expertise-led business with partner-driven operations or services."],["small","Small local / owner-managed business","Direct control and lower administrative burden are important."]]},
{id:"ownership",cat:"Ownership Structure",title:"How do you want ownership to be held?",desc:"Select the legal form in which ownership should be represented.",opts:[["shares","Through shares / shareholding","Ownership should be represented through shares and shareholding percentages."],["partners","Through partner contribution / LLP Agreement","Ownership should be represented through partner contribution and agreed partner rights — not company shares."],["single","Directly in one person's name","One person should own and control the business directly."]]},
{id:"scale",cat:"Growth",title:"How do you expect the business to grow?",desc:"Your expected scale helps determine how valuable funding flexibility and stronger governance may become.",opts:[["small","Remain small / closely held","No major expansion is expected."],["growth","Grow and expand","More customers, capital, owners or operations are expected."],["large","Large / public-market oriented","Long-term public capital or large-scale institutional growth is contemplated."]]},
{id:"foreign",cat:"Foreign / Cross-border",title:"Will there be foreign investment or foreign contribution?",desc:"Foreign ownership, investment or contribution can create additional FEMA/FCRA requirements.",opts:[["none","No","Domestic ownership and funding only."],["investment","Foreign investment","A foreign investor or FDI possibility is contemplated."],["contribution","Foreign contribution / donation","Foreign contribution or donation may be received, particularly for non-profit activity."]]}
];

const REGQ=[
{id:"sector",type:"select",cat:"Industry sector",title:"Which industry sector best describes the business?",desc:"The sector decides which industry-specific licences, environmental, safety and regulatory registrations apply.",opts:Object.entries({mfg:"Manufacturing",trd:"Trading and Retail",svc:"IT, Technology and Professional Services",food:"Food and Beverage",pha:"Pharma, Cosmetics and Medical Products",hc:"Healthcare, Hospitals and Diagnostics",re:"Real Estate, Construction and Infrastructure",agr:"Agriculture, Agri-inputs and Food Processing",fin:"Banking, NBFC, FinTech and Financial Services",ins:"Insurance and Insurance Intermediaries",tel:"Telecom, Media, Broadcasting and Digital Content",edu:"Education, Training and EdTech",hos:"Hospitality, Hotels, Restaurants and Tourism",trn:"Transport, Logistics, Warehousing and Courier",auto:"Automotive and Auto Components",chem:"Chemicals, Petrochemicals and Fertilisers",gems:"Gems, Jewellery and Precious Metals",renew:"Renewable Energy, Solar and Power Projects",min:"Mining, Minerals and Natural Resources",sec:"Security, Facility and Manpower Services",waste:"Waste Management and Recycling",text:"Textiles, Apparel and Footwear",aero:"Aerospace and Defence",biotech:"Biotechnology and Life Sciences",ecom:"E-commerce and Online Marketplace",import:"Import / Export and International Trade",print:"Printing, Packaging and Publishing",other:"Other regulated / sector-specific activity"}).map(x=>[x[0],x[1],""])},
{id:"state",type:"select",cat:"State / UT",title:"In which state or UT will the business operate?",desc:"Professional Tax, Labour Welfare Fund, Shops and Establishments, excise and many licences are state-specific.",opts:["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar","Chandigarh","Dadra, Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"].map(x=>[x,x,""])},
{id:"supply",cat:"Nature of supply",title:"What will the business supply?",desc:"GST thresholds differ for goods and services.",opts:[["g","Goods","Trading or manufacturing of goods."],["s","Services","Professional, technology or other services."],["b","Both goods and services","Mixed supplies."]]},
{id:"workforce",cat:"Workforce",title:"How many employees will the business have?",desc:"EPF, ESIC, factory and labour registrations depend on headcount thresholds.",opts:[["0","Fewer than 10","Small team."],["10","10 to 19","ESIC threshold reached."],["20","20 or more","EPF and several labour thresholds reached."]]},
{id:"ec",cat:"ESIC wage test",title:"Will any employee earn up to Rs. 21,000 per month?",desc:"ESIC covers employees up to the wage ceiling (Rs. 25,000 for persons with disability).",opts:[["y","Yes","At least one employee within the ceiling."],["n","No","All employees earn above the ceiling."]]},
{id:"contract",cat:"Contract labour",title:"Will you engage workers through contractors?",desc:"Contract labour licensing under the OSH Code applies from 50 contract workers.",opts:[["y","Yes","Outsourced or contract workforce."],["n","No","Direct employees only."]]},
{id:"premises",cat:"Premises",title:"Where will the business operate from?",desc:"Premises decide Shops and Establishments, trade licence and Fire NOC.",opts:[["r","Rented or owned commercial premises","Shop, office or warehouse."],["f","Factory or industrial premises","Manufacturing or processing unit."],["h","Home-based or online only","No separate commercial premises."]]},
{id:"interstate",cat:"Inter-state supply",title:"Will you supply goods to customers in other states?",desc:"Inter-state supply of goods requires GST registration regardless of turnover.",opts:[["y","Yes","Inter-state sales."],["n","No","Supply within one state only."]]},
{id:"packaged",cat:"Packaged goods",title:"Will you sell pre-packaged goods?",desc:"Packaged commodities attract Legal Metrology registration and labelling rules.",opts:[["y","Yes","Packed goods under a brand or label."],["n","No","Loose goods or services only."]]},
{id:"plant",type:"multi",cat:"Plant and safety",title:"Will operations involve any of the following? Select all that apply.",desc:"These trigger boiler, hazardous waste and explosives or petroleum licences.",opts:[["b","Boiler or steam equipment","Boilers Act, 2025."],["h","Hazardous chemicals, waste or effluent","Pollution control authorisations."],["x","Explosives, petroleum or gas","PESO licences."],["n","None of these","No plant-related licences expected."]]}];
const ALLQ=QUESTIONS.concat(REGQ);

const DOC_NOTES={
  "PAN": "Identifies the applicant/entity for tax and statutory registrations.",
  "Aadhaar": "Supports identity/KYC verification; use another accepted identity document where applicable.",
  "Identity proof": "Confirms the identity of the proposed owner, director, member or partner.",
  "Address proof": "Confirms residential or official address; use a current accepted document.",
  "Recent photographs": "Used for applicant/director/member identification and incorporation records.",
  "Photograph": "Recent photograph for KYC and incorporation records.",
  "Email and mobile details": "Required for communication, OTPs and statutory portal access where applicable.",
  "Class 3 DSC": "Enables secure digital signing of MCA and other electronic statutory filings.",
  "PAN of directors/shareholders": "KYC and tax identification for proposed company stakeholders.",
  "PAN of partners": "KYC and tax identification for each partner.",
  "Ownership proof": "Evidence that the applicant has a lawful right to use the premises.",
  "Partnership Deed": "Defines partner rights, capital, profit sharing, remuneration and operating terms.",
  "Nominee consent": "Records the nominee's consent required for an OPC."
};
function docText(item){const note=DOC_NOTES[item];return note?`${item} — ${note}`:item;}


let state={i:0,answers:{},scores:{},rec:null,docs:{}};
window.addEventListener("error",ev=>{console.error("Application error:",ev.error||ev.message);if(typeof toast==="function")toast("A temporary error occurred. Please use Back or New Assessment and try again.");});
window.addEventListener("unhandledrejection",ev=>{console.error("Unhandled promise rejection:",ev.reason);});

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



function optionLabel(q,v){if(q.type==="multi")return(v||[]).map(x=>(q.opts.find(o=>o[0]===x)||[0,x])[1]).join(", ")||"—";const o=q.opts.find(x=>x[0]===v);return o?o[1]:"—"}
function renderQuestion(){
 const q=ALLQ[state.i],sel=state.answers[q.id],pct=((state.i+1)/ALLQ.length)*100,p2=state.i>=QUESTIONS.length,g=id=>document.getElementById(id);
 g("qCount").textContent=`Question ${state.i+1} of ${ALLQ.length}`;
 g("qCat").textContent=(p2?"Part 2 · Registration Profile · ":"Part 1 · Business Structure · ")+q.cat;
 g("qMsg").innerHTML=""; g("qProgress").style.width=pct+"%";g("pt1").className="part "+(p2?"done":"on");g("pt2").className="part "+(p2?"on":"");
 const on=v=>q.type==="multi"?(sel||[]).includes(v):sel===v;
 const body=q.type==="select"?`<select class="selbox" id="selq"><option value="">Select…</option>${q.opts.map(o=>`<option value="${o[0]}" ${sel===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>`:`<div class="options">${q.opts.map(o=>`<label class="option ${on(o[0])?"selected":""}" data-v="${o[0]}"><span class="dot"></span><span><div class="option-title">${o[1]}</div><div class="option-detail">${o[2]}</div></span></label>`).join("")}</div>`;
 g("question").innerHTML=(state.i===QUESTIONS.length?`<div class="banner"><b>Part 1 complete.</b> Your structure answers are used to personalise the registration engine. Answer ${REGQ.length} short registration-profile questions to identify the registrations and licences that may apply to you.</div>`:"")+`<h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>${body}`;
 if(q.type==="select")g("selq").onchange=ev=>{state.answers[q.id]=ev.target.value};
 else document.querySelectorAll(".option").forEach(c=>c.addEventListener("click",()=>{const v=c.dataset.v;
  if(q.type==="multi"){let a=(state.answers[q.id]||[]).slice();a=a.includes(v)?a.filter(x=>x!==v):(v==="n"?["n"]:a.filter(x=>x!=="n").concat(v));state.answers[q.id]=a;document.querySelectorAll(".option").forEach(o=>o.classList.toggle("selected",a.includes(o.dataset.v)))}
  else{state.answers[q.id]=v;document.querySelectorAll(".option").forEach(o=>o.classList.toggle("selected",o===c))}}));
 g("prevQ").disabled=state.i===0;
 g("nextQ").textContent=state.i===ALLQ.length-1?"Generate Combined Intelligence Dashboard →":"Continue →";
}
document.getElementById("prevQ").onclick=()=>{if(state.i>0){state.i--;renderQuestion()}};
document.getElementById("nextQ").onclick=()=>{
 const g=id=>document.getElementById(id),m=g("qMsg");m.innerHTML="";
 const v=state.answers[ALLQ[state.i].id];
 if(!v||(Array.isArray(v)&&!v.length)){m.innerHTML='<div class="warnbox">Please answer this question before continuing.</div>';return}
 if(state.i===QUESTIONS.length-1&&state.ackKey!==JSON.stringify(state.answers)){
  let bad=false;try{state.scores=score(state.answers);bad=recommendation().conflict}catch(e){}
  if(bad){m.innerHTML='<div class="warnbox"><b>Your Part 1 answers conflict.</b> They do not produce a compatible structure (for example, a single owner seeking VC funding). You can go back and revise them, or continue to the registration questions anyway.<div style="margin-top:9px;display:flex;gap:8px"><button class="btn" id="cBack">Revise my answers</button><button class="btn primary" id="cGo">Continue anyway</button></div></div>';
   g("cBack").onclick=()=>{m.innerHTML="";state.i=Math.max(0,state.i-1);renderQuestion()};
   g("cGo").onclick=()=>{state.ackKey=JSON.stringify(state.answers);g("nextQ").click()};return}}
 if(state.i<ALLQ.length-1){state.i++;renderQuestion();}
 else{generate()}
};



function priority(k){return {private_limited:"Incorporation",llp:"LLP Agreement",sole:"Core registrations",partnership:"Partnership Deed",opc:"OPC incorporation",public_limited:"Corporate incorporation",section8:"Section 8 licence"}[k]}






document.getElementById("compFilter").onchange=()=>state.rec&&renderCompliance(ENTITIES[state.rec.key]);






/* TABS / NAV */
function activateTab(tab){
 document.querySelectorAll(".tab,.nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
 document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden"));
 document.getElementById("panel-"+tab).classList.remove("hidden");
 if(window.innerWidth<901)document.getElementById("sidebar").classList.remove("open");

}
document.querySelectorAll("[data-tab]").forEach(x=>x.addEventListener("click",()=>activateTab(x.dataset.tab)));
document.querySelectorAll("[data-jump]").forEach(x=>x.addEventListener("click",()=>activateTab(x.dataset.jump)));
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");

/* NEW */
document.getElementById("newBtn").onclick=function(){const b=this;if(!b.dataset.arm){b.dataset.arm=1;b.dataset.t=b.textContent;b.textContent="Click again to confirm";setTimeout(()=>{delete b.dataset.arm;b.textContent=b.dataset.t},4000);return}
 delete b.dataset.arm;b.textContent=b.dataset.t;state={i:0,answers:{},scores:{},rec:null,docs:{}};try{RG.reset()}catch(e){console.warn("Registration reset warning",e)};document.getElementById("dashboard").classList.add("hidden");document.getElementById("assessment").classList.remove("hidden");renderQuestion();window.scrollTo({top:0,behavior:"smooth"})};

/* PRINT REPORT */

document.getElementById("printBtn").onclick=pdfNow;




function generate(){
  try{
    state.scores=score(state.answers);
    state.rec=recommendation();
    if(state.rec.conflict){renderConflict();return;}
    renderDashboard();
  }catch(e){console.error(e);toast("Could not generate the dashboard ("+e.message+"). Please use Back to review your answers, or reload the page.")}
}
const RG=(()=>{
const E=[];
const S={mfg:"Manufacturing",trd:"Trading and Retail",svc:"IT, Technology and Professional Services",food:"Food and Beverage",pha:"Pharma, Cosmetics and Medical Products",hc:"Healthcare, Hospitals and Diagnostics",re:"Real Estate, Construction and Infrastructure",agr:"Agriculture, Agri-inputs and Food Processing",fin:"Banking, NBFC, FinTech and Financial Services",ins:"Insurance and Insurance Intermediaries",tel:"Telecom, Media, Broadcasting and Digital Content",edu:"Education, Training and EdTech",hos:"Hospitality, Hotels, Restaurants and Tourism",trn:"Transport, Logistics, Warehousing and Courier",auto:"Automotive and Auto Components",chem:"Chemicals, Petrochemicals and Fertilisers",gems:"Gems, Jewellery and Precious Metals",renew:"Renewable Energy, Solar and Power Projects",min:"Mining, Minerals and Natural Resources",sec:"Security, Facility and Manpower Services",waste:"Waste Management and Recycling",text:"Textiles, Apparel and Footwear",aero:"Aerospace and Defence",biotech:"Biotechnology and Life Sciences",ecom:"E-commerce and Online Marketplace",import:"Import / Export and International Trade",print:"Printing, Packaging and Publishing",other:"Other regulated / sector-specific activity"};
const ST=[];
const PT=["Maharashtra","Karnataka","West Bengal","Gujarat","Tamil Nadu","Andhra Pradesh","Telangana","Kerala","Assam","Madhya Pradesh","Odisha","Meghalaya","Tripura","Sikkim","Mizoram","Bihar","Jharkhand","Chhattisgarh","Manipur","Nagaland","Puducherry"];
const LW=["Maharashtra","Karnataka","Gujarat","Tamil Nadu","Delhi","West Bengal","Andhra Pradesh","Telangana","Kerala","Madhya Pradesh","Punjab","Haryana","Goa","Odisha","Chhattisgarh","Himachal Pradesh","Chandigarh"];
const DRY=["Gujarat","Bihar","Nagaland"];
const R=(n,d,s,i,r,sec,x,add)=>({n,d,s,i,r,sec,x:(x||"").split(" "),add});
const G=[
  [
    "A. Entity Formation and Corporate",
    [
      {
        "n": "Entity Registration (Company / LLP / Partnership / Proprietorship)",
        "d": "Constitutes the legal entity (Companies Act, 2013; LLP Act, 2008; Partnership Act, 1932).",
        "s": "No",
        "i": "No",
        "r": "Company and LLP register with RoC (central). A partnership firm registers with the state Registrar of Firms (optional).",
        "sec": "*",
        "x": [
          ""
        ],
        "preview": true
      },
      {
        "n": "Director Identification Number (DIN)",
        "d": "Unique ID for every director or designated partner (Companies Act, 2013, Sec. 153).",
        "s": "No",
        "i": "No",
        "r": "Directors of companies and designated partners of LLPs.",
        "sec": "*",
        "x": [
          "corp"
        ],
        "preview": true
      },
      {
        "n": "Digital Signature Certificate (DSC)",
        "d": "Needed for MCA, GST, Income Tax and DGFT filings (IT Act, 2000).",
        "s": "No",
        "i": "No",
        "r": "Nationwide.",
        "sec": "*",
        "x": [
          ""
        ],
        "preview": true
      },
      {
        "n": "Foreign Investment Reporting (RBI FIRMS portal)",
        "d": "Entity master and reporting for FDI/ODI (FEMA, 1999; FEMA NDI Rules, 2019).",
        "s": "No",
        "i": "Yes",
        "r": "Only businesses with foreign investment. Sectoral caps and routes apply.",
        "sec": "*",
        "x": [
          "fgn"
        ],
        "preview": true
      }
    ]
  ],
  [
    "B. Tax Registrations",
    [
      {
        "n": "PAN",
        "d": "Mandatory identifier for income tax (Income-tax Act).",
        "s": "No",
        "i": "No",
        "r": "Nationwide.",
        "sec": "*",
        "x": [
          ""
        ],
        "preview": true
      },
      {
        "n": "TAN",
        "d": "Needed to deduct or collect tax at source (earlier Sec. 203A of the 1961 Act; check the corresponding 2025 Act provision).",
        "s": "No",
        "i": "No",
        "r": "Nationwide.",
        "sec": "*",
        "x": [
          ""
        ],
        "preview": true
      },
      {
        "n": "GST Registration",
        "d": "Mandatory above threshold turnover, for inter-state supply and for specified persons (CGST Act, 2017, Sec. 22-24).",
        "s": "Yes",
        "i": "No",
        "r": "State-wise, PAN-based. A separate registration is needed in each state of supply or operation.",
        "sec": "*",
        "x": [
          "gst"
        ],
        "preview": true
      },
      {
        "n": "Professional Tax (Enrolment and Registration)",
        "d": "Levied by states on employers and professionals (Art. 276 of the Constitution; state Acts).",
        "s": "Yes",
        "i": "No",
        "r": "Levied in e.g. Maharashtra, Karnataka, West Bengal, Gujarat, Tamil Nadu, Andhra Pradesh, Telangana, Kerala, Assam, Madhya Pradesh. Not in e.g. Delhi, Haryana, Uttar Pradesh, Rajasthan.",
        "sec": "*",
        "x": [
          "pt"
        ],
        "preview": true
      },
      {
        "n": "Customs / ICEGATE Registration and AD Code",
        "d": "Needed for filing bills of entry and shipping bills (Customs Act, 1962).",
        "s": "No",
        "i": "No",
        "r": "Importers and exporters only.",
        "sec": "*",
        "x": [
          "trade"
        ],
        "preview": true
      }
    ]
  ],
  [
    "C. Business and Trade Registrations",
    [
      {
        "n": "Shops and Establishments Registration",
        "d": "Regulates working hours, leave and wages for commercial establishments.",
        "s": "Yes",
        "i": "No",
        "r": "State Acts, e.g. Maharashtra Shops and Establishments Act, 2017; Karnataka SE Act, 1961.",
        "sec": "*",
        "x": [
          "pm"
        ],
        "preview": true
      },
      {
        "n": "Trade Licence (Municipal / Local Body)",
        "d": "Permission to operate from premises (state municipal Acts).",
        "s": "Yes",
        "i": "No",
        "r": "Varies by municipal corporation.",
        "sec": "*",
        "x": [
          "pm"
        ],
        "preview": true
      },
      {
        "n": "Udyam (MSME) Registration",
        "d": "MSME status and benefits such as priority-sector lending and delayed-payment protection (MSMED Act, 2006).",
        "s": "No",
        "i": "No",
        "r": "Manufacturing and services.",
        "sec": "*",
        "x": [
          "opt"
        ],
        "preview": true
      },
      {
        "n": "Import Export Code (IEC)",
        "d": "10-character code from DGFT (Foreign Trade (Development and Regulation) Act, 1992).",
        "s": "No",
        "i": "No",
        "r": "International trade only.",
        "sec": "*",
        "x": [
          "trade"
        ],
        "preview": true
      },
      {
        "n": "RCMC (Registration-cum-Membership Certificate)",
        "d": "Needed to claim export benefits under the Foreign Trade Policy.",
        "s": "No",
        "i": "Yes",
        "r": "Export promotion council by product, e.g. EPCH for handicrafts, APEDA for agri-products.",
        "sec": "mfg,food,agr,pha,trd",
        "x": [
          "trade"
        ],
        "preview": true
      },
      {
        "n": "Startup India (DPIIT) Recognition",
        "d": "Optional. Gives tax and compliance benefits.",
        "s": "No",
        "i": "No",
        "r": "Nationwide.",
        "sec": "*",
        "x": [
          "opt"
        ],
        "preview": true
      },
      {
        "n": "Trademark / Other IP Registration",
        "d": "Optional but advisable (Trade Marks Act, 1999).",
        "s": "No",
        "i": "No",
        "r": "Nationwide.",
        "sec": "*",
        "x": [
          "opt"
        ],
        "preview": true
      }
    ]
  ],
  [
    "D. Labour and Employment",
    [
      {
        "n": "EPF Registration",
        "d": "Provident fund for 20 or more employees, voluntary below that (EPF & MP Act, 1952, now Code on Social Security, 2020).",
        "s": "No",
        "i": "No",
        "r": "Nationwide.",
        "sec": "*",
        "x": [
          "e20"
        ],
        "preview": true
      },
      {
        "n": "ESIC Registration",
        "d": "Health and social insurance for employees earning up to Rs. 21,000 per month (ESI Act, 1948, now Social Security Code).",
        "s": "Partly",
        "i": "No",
        "r": "Depends on notified areas and the 10-employee threshold.",
        "sec": "*",
        "x": [
          "e10",
          "ec"
        ],
        "preview": true
      },
      {
        "n": "Labour Welfare Fund Registration",
        "d": "Employer and employee contributions to a state welfare fund.",
        "s": "Yes",
        "i": "No",
        "r": "e.g. Maharashtra, Karnataka, Gujarat, Tamil Nadu, Delhi, West Bengal.",
        "sec": "*",
        "x": [
          "lwf"
        ],
        "preview": true
      },
      {
        "n": "Contract Labour Licence / Registration",
        "d": "Principal employer registration and contractor licence: 20 or more contract workers under CLRA, 1970; 50 or more under OSH Code, 2020.",
        "s": "Yes",
        "i": "Yes",
        "r": "Construction, security, housekeeping, manufacturing and similar industries.",
        "sec": "mfg,re,sec,trn,min,hos,food,pha",
        "x": [
          "e20",
          "cl"
        ],
        "preview": true
      },
      {
        "n": "Factory Licence and Registration",
        "d": "Needed above the worker threshold (Factories Act, 1948: 10 with power / 20 without; OSH Code, 2020: 20 / 40).",
        "s": "Yes",
        "i": "Yes",
        "r": "Manufacturing units. State Factories Rules apply.",
        "sec": "mfg,food,pha,agr,min",
        "x": [
          "e10"
        ],
        "preview": true
      },
      {
        "sec": "re,min,agr",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,re,agr,min",
        "x": [
          "ver"
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      }
    ]
  ],
  [
    "E. Environment, Safety and Local Compliance",
    [
      {
        "sec": "mfg,food,pha,hc,hos,re,min,agr",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,re,min",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,pha,hc",
        "x": [
          "hw"
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "*",
        "x": [
          "pm"
        ],
        "s": "Yes",
        "i": "No",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,trd,food,pha,agr",
        "x": [
          "pk"
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,food,pha,agr",
        "x": [
          "bl"
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,food,pha,re,min",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      }
    ]
  ],
  [
    "F. Industry-Specific Licences",
    [
      {
        "sec": "food,hos,trd,agr",
        "x": [
          ""
        ],
        "s": "Partly",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "pha,hc,trd",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,trd",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "food,hos,mfg",
        "x": [
          "dry"
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "agr",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "agr,trd",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,trn,min",
        "x": [
          "px"
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "hc",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "hos,food",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "sec",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "fin",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "trn",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "min",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "re",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      }
    ]
  ],
  [
    "G. Regulated Financial and Telecom Sectors",
    [
      {
        "sec": "fin",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "fin",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "fin",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "fin",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "tel",
        "x": [
          ""
        ],
        "s": "Partly",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,svc,tel",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      }
    ]
  ],
  [
    "H. Additional Registrations (Supplementing the Earlier List)",
    [
      {
        "sec": "*",
        "x": [
          "co"
        ],
        "s": "No",
        "i": "No",
        "startup": false,
        "preview": false
      },
      {
        "sec": "*",
        "x": [
          "opt"
        ],
        "s": "No",
        "i": "No",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,trd",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "mfg,food,pha,hos,re,min",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "trd",
        "x": [
          ""
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "re,hos,hc",
        "x": [
          ""
        ],
        "s": "Yes",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "*",
        "x": [
          "fo"
        ],
        "s": "No",
        "i": "No",
        "startup": false,
        "preview": false
      },
      {
        "sec": "hos",
        "x": [
          ""
        ],
        "s": "Partly",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "*",
        "x": [
          "np"
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "*",
        "x": [
          "np"
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      },
      {
        "sec": "*",
        "x": [
          "fc"
        ],
        "s": "No",
        "i": "Yes",
        "startup": false,
        "preview": false
      }
    ]
  ]
];

const PV=[];

const P={
  "1": [
    "RoC (MCA) / State Registrar of Firms",
    "Company: SPICe+ yields CIN, PAN, TAN and DIN together. LLP: FiLLiP, and the LLP Agreement is filed in Form 3 within 30 days. Partnership: registration is optional (Sec. 58), but an unregistered firm cannot sue third parties on contracts (Sec. 69)."
  ],
  "2": [
    "MCA",
    "Every director needs a DIN (Sec. 153), obtained through SPICe+ or Form DIR-3. LLP designated partners also need one. Periodic KYC through DIR-3 KYC is required, so confirm the current due date."
  ],
  "5": [
    "Income Tax Department",
    "Every taxpayer needs a PAN. It must be quoted for specified transactions and for GST, TDS and bank compliance. It is allotted on application in the prescribed form, or on incorporation."
  ],
  "6": [
    "Income Tax Department",
    "Any person who must deduct or collect tax at source must hold a TAN and quote it in TDS/TCS returns, challans and certificates."
  ],
  "7": [
    "GST Council / State tax authority",
    "Liability arises under Sec. 22 above aggregate turnover of Rs. 40 lakh (goods) or Rs. 20 lakh (services), with lower limits for special category states. Sec. 24 mandates registration regardless of turnover for persons such as e-commerce operators and casual or non-resident taxable persons, and for inter-state supply of goods. Apply within 30 days of liability (Sec. 25). A separate registration is needed in each state."
  ],
  "8": [
    "State commercial tax / labour department",
    "Art. 276 caps professional tax at Rs. 2,500 per person per year. Employers obtain an enrolment certificate for themselves and a registration certificate to deduct from salaries (e.g. PTEC and PTRC in Maharashtra), and file returns under the state Act."
  ],
  "10": [
    "State Labour Dept / local body",
    "Registration or intimation is required within the period set by the state Act, commonly 30 days of commencement. The certificate must be displayed. Thresholds differ: Maharashtra's 2017 Act requires registration for 10 or more workers and only intimation for fewer."
  ],
  "12": [
    "Ministry of MSME",
    "Free, self-declaration on the Udyam portal using Aadhaar and PAN. From 1 April 2025, limits are: micro up to Rs. 2.5 crore investment and Rs. 10 crore turnover; small up to Rs. 25 crore and Rs. 100 crore; medium up to Rs. 125 crore and Rs. 500 crore."
  ],
  "13": [
    "DGFT",
    "Required to import or export, subject to exceptions. One IEC per PAN, valid for life, fee Rs. 500, with details to be updated or confirmed annually."
  ],
  "17": [
    "EPFO",
    "Applies to establishments with 20 or more employees, voluntarily below that. Contribution is 12% of wages each by employer and employee on a wage ceiling of Rs. 15,000, with monthly ECR filing by the 15th."
  ],
  "18": [
    "ESIC",
    "Applies to establishments with 10 or more employees in notified areas, covering employees earning up to Rs. 21,000 per month. Employer contributes 3.25% and employee 0.75% of wages."
  ],
  "20": [
    "State Labour / Licensing Officer",
    "CLRA, 1970 applies from 20 contract workers; the OSH Code, 2020 raises this to 50. The principal employer registers the establishment and the contractor obtains a licence before engaging workers. Core activities generally cannot be contracted out under the Code."
  ],
  "21": [
    "State Chief Inspector of Factories",
    "Factories Act, 1948 applies at 10 workers with power or 20 without. The OSH Code, 2020 raises these to 20 and 40. The state approves the site plan, grants registration and licence, and licences are renewed as per state rules."
  ]
};



const D2={
  "2": "Unique ID for every proposed or existing director (Companies Act, 2013, ss.153-154).",
  "3": "Needed for MCA, GST, income-tax and DGFT e-filings (IT Act, 2000, s.35).",
  "5": "Mandatory identifier for income tax (Income-tax Act, 2025, s.262; earlier s.139A of the 1961 Act).",
  "6": "TAN/TDCA for persons deducting TDS or collecting TCS (Income-tax Act, 2025, s.397(1); earlier s.203A).",
  "7": "Registration under CGST Act, 2017, ss.22-25, with a fast track under Rule 14A for eligible small B2B suppliers.",
  "12": "MSME status under MSMED Act, 2006, ss.7-8, with limits revised by S.O. 1364(E) effective 1 April 2025.",
  "15": "Optional DPIIT recognition under Notification G.S.R. 108(E) dated 4 February 2026.",
  "17": "Provident fund under the Code on Social Security, 2020, Ch. III, for establishments with 20 or more employees.",
  "18": "Employees' State Insurance under the Code on Social Security, 2020, Ch. IV, for establishments with 10 or more employees.",
  "20": "Contract labour licence under the OSH Code, 2020 where 50 or more contract workers are engaged (earlier 20 under CLRA, 1970).",
  "21": "Factory licence under the OSH Code, 2020: 20 or more workers with power, 40 or more without (earlier 10 and 20)."
};
const S2={
  "18": "No"
};
const VS={
  "5": "V",
  "6": "V",
  "7": "V",
  "12": "V",
  "15": "V",
  "17": "S",
  "18": "S",
  "20": "V",
  "21": "V"
},VT={V:"Verified (2025-26 sources)",S:"Verified (secondary): confirm on official portal",B:"Basis only: confirm threshold on portal"};
const SR={
  "1": "S17",
  "5": "S7, S8",
  "6": "S8",
  "7": "S9",
  "12": "S10",
  "15": "S11",
  "17": "S12, S13",
  "18": "S13",
  "20": "S2, S6",
  "21": "S2, S3"
};
const DEV=[];
const CHK=[];
const SRC=[];

const EM={private_limited:"pvt",public_limited:"pub",opc:"opc",llp:"llp",partnership:"ptn",sole:"prop",section8:"pvt"},C=["pvt","pub","opc"],CL=[...C,"llp"],Z=[0,[]];


const EN=()=>state.rec&&state.rec.key?ENTITIES[state.rec.key].name:"Structure to be confirmed";
const L={2:["Mandatory","m2"],1:["Conditional","m1"],3:["Advisory","m3"],0:["Not applicable","m0"]},NT={2:"Required on the basis of your profile.",1:"Depends on thresholds or facts not yet confirmed. Review before concluding.",3:"Optional but commercially advisable.",0:"Not triggered by your profile."};
const FB="Refer to the statute cited in the purpose and confirm current rules with the issuing authority.",prov=i=>(P[i]||[0,FB])[1],auth=i=>P[i]?P[i][0]:"Issuing authority under the cited statute",$=i=>document.getElementById(i);
function fit(r){const a=state.answers,e=EM[state.rec&&state.rec.key]||"",s=a.sector,t=a.state,T={under20:"u20","20to40":"m40","40plus":"m5"}[a.turnover]||"",w=a.workforce,cl=a.contract,ix=a.interstate,N=a.supply,pm=a.premises,ec=a.ec,pk=a.packaged,hz=a.plant||[],f=(a.activity==="import"||a.foreign==="investment")?"y":"n";let k=0,o=0,y=[];
if(r.sec==="*")y.push("Relevant to every business");else if(!r.sec.split(",").includes(s))return Z;else y.push("Your sector ("+S[s]+") is covered");
for(const x of r.x){
if(x==="np"){if(a.objective!=="nonprofit")return Z;y.push("You selected a non-profit objective")}
if(x==="fc"){if(a.foreign!=="contribution")return Z;y.push("You expect foreign contribution")}
if(x==="co"){if(e&&!C.includes(e))return Z;y.push("Applies to companies")}
if(x==="corp"){if(e&&!CL.includes(e))return Z;y.push("Applies to directors and designated partners")}
if(x==="fo")return Z;
if(x==="pt"){if(!PT.includes(t))return Z;y.push(t+" levies Professional Tax")}
if(x==="lwf"){if(!LW.includes(t))return Z;y.push(t+" has a Labour Welfare Fund")}
if(x==="dry"&&DRY.includes(t))return Z;
if(x==="trade"||x==="fgn"){if(f==="n")return Z;y.push("Your activity involves trade or foreign investment")}
if(x==="e10"||x==="e20"){const m=x==="e10"?10:20;if(+w<m)k=1;else y.push("Your workforce meets the "+m+"-employee threshold")}
if(x==="ec"){if(ec==="n")return Z;y.push("You have employees earning up to Rs. 21,000 per month")}
if(x==="cl"){if(cl==="n")return Z;y.push("You engage contract labour")}
if(x==="pm"){if(pm==="r"||pm==="f")y.push("You operate from physical premises");else k=1}
if(x==="pk"){if(pk==="y")y.push("You sell pre-packaged goods");else k=1}
if(x==="bl"||x==="hw"||x==="px"){const c={bl:"b",hw:"h",px:"x"}[x];if(hz.includes("n")||!hz.includes(c))return Z;y.push("Your operations involve "+{b:"a boiler",h:"hazardous chemicals or effluent",x:"explosives, petroleum or gas"}[c])}
if(x==="gst"){if(["m5","m20","o20"].includes(T))y.push("Your turnover exceeds the GST threshold");else if(T==="m40"&&(N==="s"||N==="b"))y.push("Turnover above Rs. 20 lakh crosses the threshold for services or mixed supplies");else if(ix==="y"&&N!=="s")y.push("Inter-state supply of goods requires registration");else k=1}
if(x==="ver"){k=1;y.push("Rules are still being notified, so verify the state position")}
if(x==="opt"){if(a.objective==="nonprofit"&&(r.startup||/^Startup/.test(r.n||"")))return Z;o=1}}
return[o?3:k?1:2,y]}
function items(){let i=0,a=[];for(const[g,rs]of G)for(const r0 of rs){i++;const r={...r0,d:D2[i]||r0.d,s:S2[i]||r0.s},[v,y]=fit(r);a.push({r,i,v,y,g})}return a}
let F="all",SS=0,SI=0,QS="";const done={};
function rcard(x){const{r,i,v,y}=x,d=done[i];return `<div class="oc v${v}${d?" dn":""}"><div class="oh"><span class="no">${i}</span><h3>${r.n}</h3><span class="b ${L[v][1]}">${L[v][0]}</span>${r.add?'<span class="b m">Added</span>':""}</div><p class="vb ${VS[i]||"B"}">${VT[VS[i]||"B"]}${SR[i]?" · Sources: "+SR[i]:""}</p>${y.length?`<p class="why"><b>Why it applies:</b> ${y.join("; ")}.</p>`:""}<p class="lb">Purpose</p><p>${r.d}</p><p class="lb">Key provisions</p><p>${prov(i)}</p><p class="lb">Authority</p><p>${auth(i)}</p><p class="lb">Relevant state(s) / industry</p><p>${r.r}</p><div class="ft"><span><b>State-specific:</b> ${r.s}</span><span><b>Industry-specific:</b> ${r.i}</span><button class="rdone${d?" on":""}" data-d="${i}">${d?"✓ Obtained":"Mark as obtained"}</button></div></div>`}
const stats=()=>{const a=items(),n=v=>a.filter(x=>x.v===v).length,m=a.filter(x=>x.v===2);return{a,n,m,dn:m.filter(x=>done[x.i]).length}};
function regPreview() {
  const all = items().filter(x => x.v !== 0).sort((a, b) => [2, 1, 3].indexOf(a.v) - [2, 1, 3].indexOf(b.v) || a.i - b.i);
  const visibleItems = all.filter(x => x.r.preview).slice(0, previewLimit(all.length));
  return { visibleItems, totalItems: all.length, remainingCount: all.length - visibleItems.length };
}

function render() {
  const { n, m, dn } = stats();
  const preview = regPreview();
  $("navReg").textContent = n(2);
  $("rgProf").innerHTML = '<b>Profile used:</b> ' + [EN(), ...REGQ.map(q => optionLabel(q, state.answers[q.id]))].map(x => `<span class="ch">${escapeHtml(x)}</span>`).join('');
  $("rgKpi").innerHTML = [[2, 'Mandatory', n(2)], [1, 'Conditional', n(1)], [3, 'Advisory', n(3)], [0, 'Not applicable', n(0)]].map(([v, title, total]) => `<button type="button" class="card rk k${v}" data-kf="${v}"><span>${title}</span><b>${total}</b></button>`).join('') + `<div class="card rk k4"><span>Readiness (mandatory)</span><b>${m.length ? Math.round(dn / m.length * 100) : 0}%</b><small>${dn} of ${m.length} obtained</small></div>`;
  $("rgBar").innerHTML = [2, 1, 3].map(v => `<i class="${L[v][1]}" style="width:${preview.totalItems ? n(v) / preview.totalItems * 100 : 0}%"></i>`).join('');
  $("rgChips").innerHTML = [['all', 'All applicable'], ['2', 'Mandatory'], ['1', 'Conditional'], ['3', 'Advisory'], ['0', 'Not applicable']].map(([v, title]) => `<button type="button" data-rf="${v}" aria-pressed="${F === v}" class="${F === v ? 'on' : ''}">${title}</button>`).join('') + `<button type="button" data-rs="s" aria-pressed="${Boolean(SS)}" class="${SS ? 'on' : ''}">State-specific only</button><button type="button" data-rs="i" aria-pressed="${Boolean(SI)}" class="${SI ? 'on' : ''}">Industry-specific only</button>`;
  const query = QS.toLowerCase();
  let html = previewNotice(preview);
  let matches = 0;
  for (const status of F === 'all' ? [2, 1, 3] : [+F]) {
    const rows = preview.visibleItems.filter(x => x.v === status && (!SS || x.r.s !== 'No') && (!SI || x.r.i === 'Yes') && (!query || (x.r.n + x.r.d + x.r.r).toLowerCase().includes(query)));
    matches += rows.length;
    if (rows.length) html += `<h2 class="gh">${L[status][0]} (${rows.length})</h2><p class="gn">${NT[status]}</p><div class="og">${rows.map(rcard).join('')}</div>`;
  }
  if (!matches) html += '<p class="empty-preview">No preview registrations match these filters.</p>';
  $("rgOut").innerHTML = html + LockedPremiumSection(preview.remainingCount, 'registration reviews');
}

function snap(){const{n,m,dn}=stats(),nx=regPreview().visibleItems.find(x=>x.v===2&&!done[x.i]),an=state.answers;
$("snap").innerHTML=[[2,"Mandatory registrations",n(2),"Open the planner →"],[1,"Conditional registrations",n(1),"Confirm thresholds →"],[4,"Registration readiness",(m.length?Math.round(dn/m.length*100):0)+"%",dn+" of "+m.length+" mandatory obtained"],[3,"Next registration to obtain",nx?nx.r.n:"Full report required","From your mandatory list"]].map(([k,t,v,s])=>`<div class="card rk k${k}" data-kf="${k===4||k===3?2:k}"><span>${t}</span><b style="font-size:${String(v).length>8?"14px":"30px"}">${v}</b><small>${s}</small></div>`).join("");
$("heroPills").innerHTML=[S[an.sector],an.state,n(2)+" mandatory registrations"].map(x=>`<span class="pill">${x}</span>`).join("")}
function printHtml(){return registrationPrintHtml(regPreview())}
function actionText(){return "Review the registration preview."}

function lu(){}


document.addEventListener("click",ev=>{const b=ev.target.closest("[data-rf],[data-rs],[data-d],[data-kf]");if(!b)return;
if(b.dataset.rf){F=b.dataset.rf;render()}
else if(b.dataset.rs){if(b.dataset.rs==="s")SS=!SS;else SI=!SI;render()}
else if(b.dataset.d){done[b.dataset.d]=!done[b.dataset.d];render();snap()}
else if(b.dataset.kf){F=b.dataset.kf;render();activateTab("registrations")}});
$("rgQ").addEventListener("input",ev=>{QS=ev.target.value;render()});
return{render,snap,lu,printHtml,actionText,getPreview:regPreview,reset(){for(const k in done)delete done[k];F="all";SS=SI=0;QS="";$("rgQ").value=""}}})();
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("on"),6000)}
function printNow(){
 try{
  if(!state.rec||!state.rec.key){toast(state.rec&&state.rec.conflict?"No compatible structure was identified. Revise the assessment before printing.":"Please complete the assessment first.");return}
  buildPrint(ENTITIES[state.rec.key]);
  const report=document.getElementById("printReport");
  if(!report||!report.innerHTML.trim())throw new Error("Print report could not be prepared");
  // Give the browser one rendering cycle before opening the native print dialog.
  requestAnimationFrame(()=>setTimeout(()=>{
   try{window.print()}catch(e){toast("Print could not be opened. Press Ctrl+P (Cmd+P on Mac) to print or save as PDF.");return}
  },60));
 }catch(e){console.error("Print error:",e);toast("Print preparation failed. Press Ctrl+P (Cmd+P on Mac) to print or save as PDF.")}
}
const pdfClean=s=>String(s==null?"":s).replace(/₹/g,"Rs. ").replace(/→/g,"->").replace(/[✓✔]/g,"Yes").replace(/☐/g,"[ ]").replace(/≥/g,">=").replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g,"");
function pdfNow(){
 if(!state.rec||!state.rec.key){toast(state.rec&&state.rec.conflict?"No compatible structure was identified, so the report cannot be built. Revise your Part 1 answers and regenerate.":"Please complete the assessment first.");return}
 try{
  if(!window.jspdf||typeof window.jspdf.jsPDF!=="function")throw new Error("PDF engine unavailable");
  buildPrint(ENTITIES[state.rec.key]);
  const report=document.getElementById("printReport");
  if(!report||!report.innerHTML.trim())throw new Error("PDF report could not be prepared");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=40,tx=e=>pdfClean(e.textContent.replace(/\s+/g," ").trim());
  let y=M,rows=[];
  const need=n=>{if(y+n>H-50){doc.addPage();y=M}};
  const tbl=(o,fs)=>{doc.autoTable({startY:y,margin:{left:M,right:M,top:M,bottom:50},theme:"grid",styles:{fontSize:fs||8,cellPadding:4,valign:"top",overflow:"linebreak",textColor:[30,41,59],lineColor:[203,213,225]},headStyles:{fillColor:[11,18,32],textColor:255},alternateRowStyles:{fillColor:[248,250,252]},didParseCell:d=>{d.cell.text=(d.cell.text||[]).map(pdfClean)},...o});y=doc.lastAutoTable.finalY+14};
  const flush=()=>{if(rows.length){tbl({body:rows,columnStyles:{0:{cellWidth:120,fontStyle:"bold",textColor:[29,78,216]}}});rows=[]}};
  const pc=el=>{const h=el.querySelector("h4");rows.push([h?tx(h):"",[...el.children].filter(c=>c.tagName!=="H4").map(c=>c.tagName==="UL"?[...c.children].map(li=>"- "+tx(li)).join("\n"):tx(c)).join("\n")])};
  report.querySelectorAll(".print-page").forEach(pg=>{
   if(pg.classList.contains("print-cover")){
    doc.setFillColor(11,18,32);doc.rect(0,0,W,175,"F");
    doc.setTextColor(147,197,253);doc.setFontSize(9);doc.text("STRUCTURE & REGISTRATION INTELLIGENCE  |  FY 2026-27",M,50);
    doc.setTextColor(255);doc.setFontSize(26);doc.text(doc.splitTextToSize(pdfClean(pg.querySelector(".print-title").textContent),W-2*M),M,92);
    doc.setFontSize(11);doc.setTextColor(203,213,225);doc.text(doc.splitTextToSize(pdfClean(pg.querySelector(".print-sub").textContent),W-2*M),M,118);
    doc.setFontSize(9);doc.text("Prepared on "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}),M,158);
    y=200;tbl({body:[...pg.querySelectorAll(".pkpi")].map(k=>[tx(k.querySelector(".pkpi-label")),tx(k.querySelector(".pkpi-value"))]),columnStyles:{0:{cellWidth:120,fontStyle:"bold"}}});
    pg.querySelectorAll(".pcard").forEach(pc);flush();doc.addPage();y=M;return}
   const st=pg.querySelector(".print-section-title");
   if(st){need(70);doc.setFontSize(14);doc.setFont(undefined,"bold");doc.setTextColor(11,18,32);doc.text(tx(st),M,y+12);doc.setDrawColor(184,137,43);doc.setLineWidth(2);doc.line(M,y+19,W-M,y+19);doc.setFont(undefined,"normal");y+=36}
   [...pg.children].forEach(el=>{
    if(el===st||el.classList.contains("print-foot"))return;
    if(el.classList.contains("print-grid2"))el.querySelectorAll(".pcard").forEach(pc);
    else if(el.classList.contains("pcard"))pc(el);
    else if(el.tagName==="TABLE"){flush();const nc=el.rows[0].cells.length,reg=nc===5&&/Registration/.test(el.rows[0].textContent),comp6=nc===6&&/Default timing/.test(el.rows[0].textContent);tbl({html:el,columnStyles:reg?{0:{cellWidth:24},1:{cellWidth:92},2:{cellWidth:56},4:{cellWidth:84}}:comp6?{0:{cellWidth:48},1:{cellWidth:70},2:{cellWidth:86},3:{cellWidth:105},4:{cellWidth:120},5:{cellWidth:85}}:undefined},nc>=7?6.5:8)}
    else{flush();const t=tx(el);if(t){need(34);doc.setFontSize(9);doc.setTextColor(51,65,85);const ln=doc.splitTextToSize(t,W-2*M);doc.text(ln,M,y+8);y+=ln.length*11+10}}
   });flush();y+=8
  });
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(100,116,139);doc.setDrawColor(226,232,240);doc.setLineWidth(.5);doc.line(M,H-36,W-M,H-36);doc.text("Business Structure & Registration Intelligence | Preliminary decision support. Verify current law before acting.",M,H-24);doc.text("Page "+i+" of "+n,W-M,H-24,{align:"right"})}
  window.__lastPdf=doc;
  const blob=doc.output("blob");
  if(!blob||!blob.size)throw new Error("Empty PDF generated");
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="Biz_Matrix_35_Percent_Preview.pdf";a.style.display="none";document.body.appendChild(a);a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},2000);
  toast("PDF report generated successfully. Check your browser Downloads folder.");
 }catch(e){
  console.error("PDF error:",e);
  toast("PDF download could not be completed. Opening the print dialog so you can choose Save as PDF.");
  setTimeout(printNow,120);
 }
}
window.addEventListener("beforeprint",()=>{if(state.rec&&state.rec.key)buildPrint(ENTITIES[state.rec.key])});

renderQuestion();
