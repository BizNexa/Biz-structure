
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
{id:"objective",cat:"Objective",title:"What is the main purpose of the organisation?",desc:"A charitable objective can only use a Section 8 company in this tool; a commercial objective rules it out (R-001, R-002).",opts:[["profit","Commercial / for-profit","Owners will earn and take out profits."],["nonprofit","Charitable / not-for-profit","Profits will be used only for charitable, educational, social or similar objects. No dividends."]]},
{id:"founders",cat:"Owners at start",title:"How many owners will there be at the start?",desc:"The law sets minimum owner counts: proprietorship and OPC have exactly one, partnership, LLP and Pvt Ltd need two, a public company needs seven (R-003 to R-005).",opts:[["one","Just me (1 owner)","A single owner or founder."],["two_to_six","2 to 6 owners","Co-founders, partners or family members."],["seven_plus","7 or more owners","A larger founding group."]]},
{id:"residency",def:"resident",cat:"Residency & citizenship",title:"Where do the founders live and what citizenship do they hold?",desc:"OPC members must be Indian citizens; a foreign national generally needs RBI approval for a proprietorship or partnership; companies need one director resident in India and LLPs one resident designated partner (R-008, R-020, R-023, R-025).",opts:[["resident","All are resident Indians","Every founder is an Indian citizen living in India."],["nri","Includes an NRI, but someone will live in India","At least one founder is an Indian citizen living abroad; another founder or director lives in India."],["nri_all","All founders are NRIs living abroad","Indian citizens, none of whom lives in India."],["foreign_national","Includes a foreign national, but someone will live in India","At least one founder is not an Indian citizen."],["foreign_all","Includes a foreign national and no one will live in India","No founder or director will be resident in India."]]},
{id:"practice",def:"none",assume:true,assumeText:"No regulated professional practice or licensed financial business, unless you selected one under specific activities.",cat:"Regulated practice or licensed activity",title:"Is this a regulated professional practice or a specially licensed business?",desc:"Some professions and licences only work with certain structures, so this can rule options out.",info:"CAs, CSs, CMAs and advocates cannot practise through a company; NBFC registration needs a company; an insurer must be a public company (R-014 to R-018, R-021).",opts:[["none","Neither","An ordinary commercial business."],["ca_cs_cma","CA, CS or Cost Accountant practice","Members in practice."],["advocate","Advocate / law practice","A law practice."],["other_regulated","Doctor, architect or other regulated profession","Council rules must be checked."],["nbfc","Lending / NBFC","Lending, investment or other non-banking finance."],["insurance","Insurance company","Acting as an insurer."],["other_licensed","Other licensed sector","Telecom, defence, broadcasting or another licensed / FDI-capped sector."]]},
{id:"foreign",cat:"Foreign money",title:"Will the business receive money from outside India?",desc:"FDI is not permitted in proprietorships and firms, an OPC cannot have a foreign shareholder, and foreign donations need FCRA (R-009, R-010).",opts:[["none","No","Indian money only."],["investment","Foreign investment","A foreign investor will put in equity or capital."],["contribution","Foreign donations","Grants or donations from foreign sources (for non-profits)."]]},
{id:"funding",cat:"Funding route",title:"How will you fund the business?",desc:"Only companies issue shares to investors, and only a public company can raise money from the public (R-011, R-012).",np:true,opts:[["bank","Own money or bank loans","Founders' funds and borrowing, no outside equity."],["vc","Angel, VC or other equity investors","Investors will buy shares in the business."],["public","Public issue / listing","Raising money from the public or listing on an exchange."]]},
{id:"esop",cat:"Employee stock options",title:"Do you plan to give employees stock options (ESOPs)?",desc:"Statutory ESOPs exist only for companies with more than one member (R-013).",np:true,opts:[["yes","Yes, within 3 years","ESOPs are part of the hiring plan."],["no","No","No employee equity planned."],["unsure","Not sure","Undecided. This does not rule anything out yet."]]},
{id:"max_owners",def:"up_to_50",assume:true,assumeIf:a=>a.founders!=="one",assumeText:"The business will have no more than 50 owners in 5 years.",skip:a=>a.objective==="nonprofit"||!(a.founders==="seven_plus"||a.funding==="vc"||a.funding==="public"),cat:"Future owners",title:"How many people could own the business in 5 years, at most?",desc:"A partnership cannot exceed 50 partners and a private company cannot exceed 200 members (R-006, R-007).",opts:[["up_to_50","Up to 50","Closely held."],["51_200","51 to 200","Many partners, employee owners or small investors."],["over_200","More than 200","A large member or investor base."]]},
{id:"liability",cat:"Liability risk",title:"How much liability risk does the business activity carry?",desc:"Think about claims from customers, lenders, suppliers or accidents. Proprietors and partners are personally liable; LLP and company owners are generally not. If you choose High, Proprietorship and Partnership are ruled out (R-024; factor F09, weight 20).",np:true,opts:[["critical","High: claims could exceed my personal assets","For example manufacturing, food, construction, real estate, healthcare, lending or large contracts."],["preferred","Moderate: some exposure","Typical trading or services with contracts, staff and premises."],["acceptable","Low: little risk of large claims","Small consulting, freelancing or a low-risk local business."]]},
{id:"profit_level",defFn:a=>({lt20:"lt_25L","20_40":"lt_25L","40_150":"25L_2cr","150_500":"25L_2cr",gt500:"gt_2cr"}[a.turnover]||"lt_25L"),def:"lt_25L",assume:true,assumeText:"Year-3 profit is estimated from your expected turnover.",cat:"Profit level",title:"What annual profit do you expect by year 3?",desc:"Slab, firm and company tax rates cross over at different profit levels (factor F10, weight 15).",np:true,opts:[["lt_25L","Up to ₹25 lakh","Small or early-stage profits."],["25L_2cr","₹25 lakh to ₹2 crore","A mid-sized, established business."],["gt_2cr","Above ₹2 crore","A large, high-profit business."]]},
{id:"extraction",cat:"Use of profit",title:"What will you do with most of the profit?",desc:"Company profit taken out as dividends is taxed twice; firm and LLP profit share is taxed once (factor F10).",np:true,opts:[["withdraw","Take it out","Owners will take most of the profit home."],["retain","Reinvest in the business","Most profit will stay in the business to fund growth."]]},
{id:"compliance",cat:"Compliance appetite",title:"How much ongoing compliance can you handle?",desc:"Companies need audits, board meetings and ROC filings; proprietorships and firms need far fewer (factor F14, weight 15).",np:true,opts:[["low","Keep it minimal","Tax returns and little else."],["moderate","Regular filings are fine","Annual returns, accounts and occasional audits."],["high","Full corporate compliance is fine","Board meetings, statutory audit and ROC filings with professional support."]]},
{id:"credibility",def:"low",assume:true,assumeText:"Credibility with banks, tenders or large clients helps but is not decisive.",cat:"Credibility",title:"Do you need credibility with banks, tenders or large corporate clients?",desc:"Lenders, tender documents and enterprise vendor onboarding often prefer incorporated entities (factor F15, weight 10).",np:true,opts:[["high","Yes, it matters a lot","Bank loans, government tenders or enterprise customers are central."],["low","Not really","Retail customers or small clients."]]},
{id:"exit",cat:"Long-term plan",title:"What is your long-term plan for the business?",desc:"Selling shares is the cleanest exit; a proprietorship can only be sold as assets (factor F16, weight 10).",np:true,opts:[["sell","Sell it or bring in a buyer","An acquisition, strategic sale or investor exit."],["succession","Pass it to family","Continuity across generations."],["none","No plan yet","Run it for now."]]},
{id:"business",def:"small",assume:true,assumeText:"You do not plan to apply for Startup India (DPIIT) recognition.",cat:"Startup India",title:"Will you apply for Startup India (DPIIT) recognition?",desc:"DPIIT recognition is open to Pvt Ltd, LLP and registered firms, not to proprietorships, OPCs or public companies (factor F19, weight 5).",np:true,opts:[["startup","Yes, we plan to apply","An innovative or scalable business seeking DPIIT benefits."],["professional","No, it is a professional or consulting practice","Expertise-led services."],["small","No, it is a small or traditional business","Trading, local services or manufacturing without DPIIT plans."]]}
];
const REGQ=[
{id:"sector",type:"select",cat:"Industry sector",title:"Which industry sector best describes the business?",desc:"The sector decides which industry licences, environmental, safety and regulatory registrations apply (Registration Master Map, Part D).",opts:Object.entries({mfg:"Manufacturing",trd:"Trading and Retail",svc:"IT, Technology and Professional Services",food:"Food and Beverage",pha:"Pharma, Cosmetics and Medical Products",hc:"Healthcare, Hospitals and Diagnostics",re:"Real Estate, Construction and Infrastructure",agr:"Agriculture, Agri-inputs and Food Processing",fin:"Banking, NBFC, FinTech and Financial Services",ins:"Insurance and Insurance Intermediaries",tel:"Telecom, Media, Broadcasting and Digital Content",edu:"Education, Training and EdTech",hos:"Hospitality, Hotels, Restaurants and Tourism",trn:"Transport, Logistics, Warehousing and Courier",auto:"Automotive and Auto Components",chem:"Chemicals, Petrochemicals and Fertilisers",gems:"Gems, Jewellery and Precious Metals",renew:"Renewable Energy, Solar and Power Projects",min:"Mining, Minerals and Natural Resources",sec:"Security, Facility and Manpower Services",waste:"Waste Management and Recycling",text:"Textiles, Apparel and Footwear",aero:"Aerospace and Defence",biotech:"Biotechnology and Life Sciences",ecom:"E-commerce and Online Marketplace",import:"Import / Export and International Trade",print:"Printing, Packaging and Publishing",other:"Other regulated / sector-specific activity"}).map(x=>[x[0],x[1],""])},
{id:"activities",type:"multi",def:["n"],cat:"Specific activities",title:"Which of these describe the business? Select all that apply.",desc:"Specific activities trigger specific licences. The list is filtered to your sector.",get opts(){return KB.activityOptions(state.answers.sector)}},
{id:"state",type:"select",cat:"State / UT",title:"In which state or UT will the business operate?",desc:"Professional Tax, Labour Welfare Fund, Shops & Establishments, stamp duty and many licences are state-specific (Part E).",opts:["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar","Chandigarh","Dadra, Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"].map(x=>[x,x,""])},
{id:"supply",cat:"Nature of supply",title:"What will the business supply?",desc:"GST thresholds differ for goods (₹40 lakh in most states) and services (₹20 lakh).",opts:[["g","Goods","Trading or manufacturing of goods."],["s","Services","Professional, technology or other services."],["b","Both goods and services","Mixed supplies."]]},
{id:"turnover",cat:"Expected turnover",title:"What annual turnover do you expect in the first two years?",desc:"Turnover drives GST registration, the composition option, tax audit (above ₹1 crore) and e-invoicing (above ₹5 crore).",opts:[["lt20","Up to ₹20 lakh","Below every GST threshold."],["20_40","₹20 lakh to ₹40 lakh","Above the services threshold; below the goods threshold in most states."],["40_150","₹40 lakh to ₹1.5 crore","GST applies; composition may be available."],["150_500","₹1.5 crore to ₹5 crore","Tax audit range; above the composition limit."],["gt500","Above ₹5 crore","E-invoicing and larger-entity compliances."]]},
{id:"channels",type:"multi",cat:"Trade, sales & data",title:"Which of these apply to the business? Select all that apply.",desc:"Marketplace selling forces GST registration; collecting personal data online brings the DPDP Act; bulk SMS needs TRAI DLT; selling to government needs GeM.",opts:[["import","Import goods or services","Bringing goods or services into India (IEC needed)."],["export","Export goods or services","Selling abroad (IEC, LUT, AD code)."],["marketplace","Sell through e-commerce marketplaces","Amazon, Flipkart, Swiggy, etc."],["website","Own website or app that collects customer data","Sign-ups, orders, payments or leads online."],["sms","Bulk or promotional SMS / WhatsApp","Marketing or transactional messages at scale."],["govt","Sell to government (tenders / GeM)","Government buyers or PSUs."],["n","None of these","Offline sales only."]]},
{id:"workforce",cat:"Workforce",title:"How many people will work in the business (including contract staff)?",desc:"OSH Code and ESIC apply from 10 workers, EPF from 20, apprenticeship from 30, and contractor licensing from 50 contract workers.",opts:[["none","Only the owners","No employees yet."],["1_9","1 to 9","A small team."],["10_19","10 to 19","OSH Code and ESIC thresholds."],["20_49","20 to 49","EPF threshold."],["50p","50 or more","Larger-establishment obligations."]]},
{id:"ec",cat:"ESIC wage test",title:"Will any employee earn up to ₹21,000 per month?",desc:"ESIC covers employees up to the wage ceiling (₹25,000 for persons with disability).",skip:a=>a.workforce==="none",opts:[["y","Yes","At least one employee is within the ESIC wage ceiling."],["n","No","All employees earn above the ceiling."]]},
{id:"contract",def:"n",assumeIf:a=>a.workforce&&a.workforce!=="none",assumeText:"You will not engage contract labour.",skip:a=>!(a.workforce==="20_49"||a.workforce==="50p"||a.sector==="sec"),cat:"Contract labour",title:"Will you engage workers through contractors?",desc:"Contract labour licensing under the OSH Code applies from 50 contract workers.",opts:[["y","Yes","Outsourced manpower, security or housekeeping."],["n","No","Direct employees only."]]},
{id:"premises",cat:"Premises",title:"Where will the business operate from?",desc:"Premises decide the registered-office documents (rent agreement, owner NOC), Shops & Establishments, trade licence and Fire NOC.",opts:[["own","Commercial premises we own","Owned by the business or a founder."],["rent","Rented commercial premises","Office, shop or warehouse on rent or lease."],["relative","Premises owned by a relative or another business","Used with the owner's permission (NOC needed)."],["factory","Factory or industrial unit","Manufacturing or processing premises."],["home","Home-based or online only","No separate commercial premises."]]},
{id:"interstate",cat:"Inter-state supply",title:"Will you supply goods to customers in other states?",desc:"Inter-state supply of goods requires GST registration regardless of turnover.",skip:a=>a.supply==="s",opts:[["y","Yes","Customers or branches outside the home state."],["n","No","Within one state only."]]},
{id:"packaged",cat:"Packaged goods",title:"Will you sell pre-packaged goods?",desc:"Packaged commodities attract Legal Metrology registration and labelling rules.",skip:a=>a.supply==="s",opts:[["y","Yes","Packed goods under your brand or as an importer."],["n","No","Loose goods or services only."]]},
{id:"plant",type:"multi",def:["n"],skip:a=>a.supply==="s"&&a.premises!=="factory",cat:"Plant and safety",title:"Will operations involve any of the following? Select all that apply.",desc:"These trigger boiler, hazardous waste and explosives or petroleum licences.",opts:[["b","A boiler","Steam boiler or economiser."],["h","Hazardous chemicals, waste or effluent","Discharge, emissions or hazardous waste."],["x","Explosives, petroleum or gas cylinders","Storage above PESO limits."],["n","None of these","No such operations."]]},
{id:"din",def:"no",assume:true,assumeText:"No proposed director or designated partner already holds a DIN / DPIN, so DINs are allotted during incorporation.",assumeFor:k=>!["sole","partnership"].includes(k),cat:"Existing DIN / DPIN",title:"Do the proposed directors or designated partners already hold a DIN / DPIN?",desc:"People without a DIN get one inside SPICe+ / FiLLiP, which changes the documents needed (Checklist trigger T11).",skip:a=>["sole","partnership"].includes(kbEntityKey(a)),opts:[["no","No, none of them","DIN will be allotted during incorporation."],["some","Some of them","A mix of new and existing DIN holders."],["yes","Yes, all of them","Existing DIN holders only."]]},
{id:"corp_owner",def:"no",assume:true,assumeText:"All owners are individuals (no company or LLP as an owner).",assumeFor:k=>!["sole","opc"].includes(k),cat:"Corporate owner",title:"Will any owner be a company, LLP or other body corporate?",desc:"A corporate owner needs a board resolution, certificate of incorporation and authorised-signatory documents (Checklist trigger T2).",skip:a=>["sole","opc"].includes(kbEntityKey(a)),opts:[["no","No","Individuals only."],["yes","Yes","At least one owner is a company or LLP."]]}
];
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

/* ---- Decision engine adapter (BizMatrix Rulebook v1.0, js/engine.js) ---- */
const ENGINE_FROM_APP={sole:"PROP",partnership:"PF",llp:"LLP",opc:"OPC",private_limited:"PVT",public_limited:"PUB",section8:"S8"};
function qSkipped(q,a){if(q.np&&a.objective==="nonprofit")return true;if(a["__ask_"+q.id])return false;if(q.assume)return true;return !!(q.skip&&q.skip(a))}
/* Answers as the engine sees them: skipped questions fall back to their documented defaults; merged questions are split back out. */
function effectiveAnswers(a){
  a=a||{};const e=Object.assign({},a);
  for(const q of ALLQ){if(q.def!==undefined&&qSkipped(q,a))e[q.id]=q.defFn?q.defFn(a):Array.isArray(q.def)?q.def.slice():q.def}
  if(e.practice==="none"&&!a["__ask_practice"]){const acts=a.activities||[];e.practice=acts.includes("ca_practice")?"ca_cs_cma":acts.includes("law_practice")?"advocate":acts.includes("insurer")?"insurance":acts.includes("lending")?"nbfc":acts.includes("reg_practice")?"other_regulated":acts.some(x=>["telecom","media","drones","restricted"].includes(x))?"other_licensed":"none"}
  if(e.practice!==undefined){const p=e.practice;e.profession=["ca_cs_cma","advocate","other_regulated"].includes(p)?p:"none";e.activity=["nbfc","insurance","other_licensed"].includes(p)?p:"none"}
  if(Array.isArray(a.channels)&&a.trade===undefined){const c=a.channels;e.trade=c.includes("import")&&c.includes("export")?"both":c.includes("import")?"import":c.includes("export")?"export":"none"}
  return e;
}
/* Defaults we applied that the user may want to change ("We assumed X — change"). */
function assumptions(a){
  a=a||{};const key=kbEntityKey(a);
  return ALLQ.filter(q=>q.assumeText&&qSkipped(q,a)&&!(q.np&&a.objective==="nonprofit")&&!(q.id==="max_owners"&&a.objective==="nonprofit")&&(!q.assumeFor||(key&&q.assumeFor(key)))&&(!q.assumeIf||q.assumeIf(a))).map(q=>({id:q.id,cat:q.cat,text:q.assumeText}));
}
function engineInputs(a){
  a=effectiveAnswers(a);
  const r=a.residency||"resident";
  return {objective:a.objective,founders:a.founders,max_owners:a.max_owners,
    residency:r==="nri_all"?"nri":r==="foreign_all"?"foreign_national":r,
    all_non_resident:r==="nri_all"||r==="foreign_all",
    foreign:a.foreign,funding:a.funding,esop:a.esop,profession:a.profession,activity:a.activity,
    liability:a.liability,compliance:a.compliance,credibility:a.credibility,exit:a.exit,business:a.business,
    profit_level:a.profit_level,extraction:a.extraction,sector:a.sector};
}
function score(a){
  const r=BizEngine.evaluate(engineInputs(a)),out={};
  (r.ranking||[]).forEach(([e,s])=>{out[BizEngine.APP_KEY[e]]=s});
  out.__engine=r;return out;
}
function recommendation(){
  const r=state.scores.__engine||BizEngine.evaluate(engineInputs(state.answers));
  if(r.verdict==="NONE"){
    const rule=BizEngine.RULES[r.emptiedBy]||{};
    return {key:null,fit:0,ranking:[],conflict:true,engine:r,
      message:`No structure in this tool's scope fits these answers. ${rule.plain||""}`};
  }
  const key=BizEngine.APP_KEY[r.verdict];
  const ranking=(r.ranking||[]).map(([e,s])=>[BizEngine.APP_KEY[e],s]);
  return {key,fit:r.ranking[0][1],ranking,conflict:false,engine:r,confidence:r.confidence,margin:r.margin,
    runnerUp:r.runner_up?BizEngine.APP_KEY[r.runner_up]:null,review:r.review||[]};
}
function drivers(a,k){
  const r=state.rec&&state.rec.engine;if(!r)return["The result reflects the rulebook's hard rules and weighted factors."];
  const x=BizEngine.explain(r,engineInputs(a));
  return x.why.concat(x.whyNot).slice(0,6);
}
function alternativeStructures(a,k){
  return state.rec.ranking.filter(([key])=>key!==k).slice(0,3);
}
function reviewFlags(){const r=state.rec&&state.rec.engine;return r?(r.review||[]).filter(id=>BizEngine.RULES[id]&&BizEngine.RULES[id].review&&id!=="R-022"):[]}
function confidenceLabel(){const c=state.rec&&state.rec.confidence;return c==="clear"?"Clear result":c==="moderate"?"Moderate confidence":c==="near-tie"?"Near-tie":c==="only eligible structure"?"Only eligible structure":"—"}


function optionLabel(q,v){if(q.type==="multi")return(v||[]).map(x=>(q.opts.find(o=>o[0]===x)||[0,x])[1]).join(", ")||"—";const o=q.opts.find(x=>x[0]===v);return o?o[1]:"—"}
const visIdx=()=>ALLQ.map((q,i)=>i).filter(i=>!qSkipped(ALLQ[i],state.answers));
const nextVis=i=>{for(let j=i+1;j<ALLQ.length;j++)if(!qSkipped(ALLQ[j],state.answers))return j;return -1};
const prevVis=i=>{for(let j=i-1;j>=0;j--)if(!qSkipped(ALLQ[j],state.answers))return j;return -1};
const lastP1=()=>{let k=-1;for(let j=0;j<QUESTIONS.length;j++)if(!qSkipped(QUESTIONS[j],state.answers))k=j;return k};
function renderQuestion(){
 const vis=visIdx(),pos=Math.max(0,vis.indexOf(state.i)),q=ALLQ[state.i],sel=state.answers[q.id],pct=((pos+1)/vis.length)*100,p2=state.i>=QUESTIONS.length,g=id=>document.getElementById(id);
 const left=vis.filter(i=>i>state.i).length;g("qCount").textContent=left?`Question ${pos+1} · about ${left} more to go`:`Question ${pos+1} · last question`;const p1n=vis.filter(i=>i<QUESTIONS.length).length,pt1s=document.querySelector("#pt1 small"),pt2s=document.querySelector("#pt2 small");if(pt1s)pt1s.textContent=p1n+" questions";if(pt2s)pt2s.textContent=vis.filter(i=>i>=QUESTIONS.length).length+" questions";
 g("qCat").textContent=(p2?"Part 2 · Registration Profile · ":"Part 1 · Business Structure · ")+q.cat;
 g("qMsg").innerHTML=""; g("qProgress").style.width=pct+"%";g("pt1").className="part "+(p2?"done":"on");g("pt2").className="part "+(p2?"on":"");
 const on=v=>q.type==="multi"?(sel||[]).includes(v):sel===v;
 const body=q.type==="select"?`<select class="selbox" id="selq"><option value="">Select…</option>${q.opts.map(o=>`<option value="${o[0]}" ${sel===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>`:`<div class="options">${q.opts.map(o=>`<label class="option ${on(o[0])?"selected":""}" data-v="${o[0]}"><span class="dot"></span><span><div class="option-title">${o[1]}</div><div class="option-detail">${o[2]}</div></span></label>`).join("")}</div>`;
 g("question").innerHTML=(state.i===QUESTIONS.length&&state.answers.objective?`<div class="banner"><b>Part 1 complete.</b> Your structure answers are used to personalise the registration engine. Answer ${REGQ.length} short registration-profile questions to identify the registrations and licences that may apply to you.</div>`:"")+`<h2 class="q-title">${q.title}</h2><p class="q-desc">${q.desc}</p>${body}`;
 if(q.type==="select")g("selq").onchange=ev=>{state.answers[q.id]=ev.target.value};
 else document.querySelectorAll(".option").forEach(c=>c.addEventListener("click",()=>{const v=c.dataset.v;
  if(q.type==="multi"){let a=(state.answers[q.id]||[]).slice();a=a.includes(v)?a.filter(x=>x!==v):(v==="n"?["n"]:a.filter(x=>x!=="n").concat(v));state.answers[q.id]=a;document.querySelectorAll(".option").forEach(o=>o.classList.toggle("selected",a.includes(o.dataset.v)))}
  else{if(q.id==="objective"&&!state.__started&&window.bmTrack){state.__started=1;bmTrack("assessment_start")}state.answers[q.id]=v;document.querySelectorAll(".option").forEach(o=>o.classList.toggle("selected",o===c))}}));
 g("prevQ").disabled=prevVis(state.i)<0;
 g("nextQ").textContent=nextVis(state.i)<0?"See my result →":"Continue →";
}
document.getElementById("prevQ").onclick=()=>{const p=prevVis(state.i);if(p>=0){state.i=p;renderQuestion()}};
document.getElementById("nextQ").onclick=()=>{
 const g=id=>document.getElementById(id),m=g("qMsg");m.innerHTML="";
 const v=state.answers[ALLQ[state.i].id];
 if(!v||(Array.isArray(v)&&!v.length)){m.innerHTML='<div class="warnbox">Please answer this question before continuing.</div>';return}
 if(state.i===lastP1()&&state.ackKey!==JSON.stringify(state.answers)){
  let bad=false,why="";try{state.scores=score(state.answers);const rc=recommendation();bad=rc.conflict;why=rc.message||""}catch(e){}
  if(bad){m.innerHTML='<div class="warnbox"><b>Your Part 1 answers conflict.</b> '+escapeHtml(why)+' You can go back and revise them, or continue to the registration questions anyway.<div style="margin-top:9px;display:flex;gap:8px"><button class="btn" id="cBack">Revise my answers</button><button class="btn primary" id="cGo">Continue anyway</button></div></div>';
   g("cBack").onclick=()=>{m.innerHTML="";state.i=0;renderQuestion()};
   g("cGo").onclick=()=>{state.ackKey=JSON.stringify(state.answers);g("nextQ").click()};return}}
 const n=nextVis(state.i);if(n>=0){state.i=n;renderQuestion();}
 else{(window.analyseThen||(f=>f()))(generate)}
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
    if(window.bmTrack)bmTrack("assessment_complete",{structure:state.rec.key,confidence:state.rec.engine&&state.rec.engine.confidence});
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
const publicRegistrationData = JSON.parse(JSON.stringify({ groups: G, provisions: P, descriptions: D2, stateFlags: S2, verification: VS, sourceRefs: SR }));
function resetRegistrationContent() { hydrateRegistrations(publicRegistrationData); }

function regPreview(forReport = false) {
  const premium = AccessProvider.isPremium();
  const all = items().filter(x => premium && !forReport && F === '0' ? x.v === 0 : x.v !== 0).sort((a, b) => [2, 1, 3, 0].indexOf(a.v) - [2, 1, 3, 0].indexOf(b.v) || a.i - b.i);
  const visibleItems = (premium ? all : all.filter(x => x.r.preview).slice(0, previewLimit(all.length))).map(x => ({ ...x, provisions: prov(x.i), authority: auth(x.i), verification: VT[VS[x.i] || 'B'], sources: SR[x.i] || '', obtained: Boolean(done[x.i]) }));
  return { visibleItems, totalItems: all.length, remainingCount: all.length - visibleItems.length };
}

function hydrateRegistrations(data) {
  if (!Array.isArray(data.groups)) throw new Error('Registration data is unavailable.');
  G.splice(0, G.length, ...data.groups);
  for (const [target, source] of [[P, data.provisions], [D2, data.descriptions], [S2, data.stateFlags], [VS, data.verification], [SR, data.sourceRefs]]) {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, source || {});
  }
}

function render() {
  const { n, m, dn } = stats();
  const preview = regPreview();
  $("navReg").textContent = n(2);
  $("rgProf").innerHTML = '<b>Profile used:</b> ' + [EN(), ...REGQ.map(q => optionLabel(q, state.answers[q.id]))].map(x => `<span class="ch">${escapeHtml(x)}</span>`).join('');
  $("rgKpi").innerHTML = [[2, 'Mandatory', n(2)], [1, 'Conditional', n(1)], [3, 'Advisory', n(3)], [0, 'Not applicable', n(0)]].map(([v, title, total]) => `<button type="button" class="card rk k${v}" data-kf="${v}"><span>${title}</span><b>${total}</b></button>`).join('') + `<div class="card rk k4"><span>Readiness (mandatory)</span><b>${m.length ? Math.round(dn / m.length * 100) : 0}%</b><small>${dn} of ${m.length} obtained</small></div>`;
  const applicableCount = n(2) + n(1) + n(3);
  $("rgBar").innerHTML = [2, 1, 3].map(v => `<i class="${L[v][1]}" style="width:${applicableCount ? n(v) / applicableCount * 100 : 0}%"></i>`).join('');
  $("rgChips").innerHTML = [['all', 'All applicable'], ['2', 'Mandatory'], ['1', 'Conditional'], ['3', 'Advisory'], ['0', 'Not applicable']].map(([v, title]) => `<button type="button" data-rf="${v}" aria-pressed="${F === v}" class="${F === v ? 'on' : ''}">${title}</button>`).join('') + `<button type="button" data-rs="s" aria-pressed="${Boolean(SS)}" class="${SS ? 'on' : ''}">State-specific only</button><button type="button" data-rs="i" aria-pressed="${Boolean(SI)}" class="${SI ? 'on' : ''}">Industry-specific only</button>`;
  const query = QS.toLowerCase();
  let html = previewNotice(preview);
  let matches = 0;
  for (const status of F === 'all' ? [2, 1, 3] : [+F]) {
    const rows = preview.visibleItems.filter(x => x.v === status && (!SS || x.r.s !== 'No') && (!SI || x.r.i === 'Yes') && (!query || (x.r.n + x.r.d + x.r.r).toLowerCase().includes(query)));
    matches += rows.length;
    if (rows.length) html += `<h2 class="gh">${L[status][0]} (${rows.length})</h2><p class="gn">${NT[status]}</p><div class="og">${rows.map(rcard).join('')}</div>`;
  }
  if (!matches) html += '<p class="empty-preview">No registrations match these filters.</p>';
  $("rgOut").innerHTML = html + LockedPremiumSection(preview.remainingCount, 'registration reviews');
}

function snap(){const{n,m,dn}=stats(),nx=regPreview(true).visibleItems.find(x=>x.v===2&&!done[x.i]),an=state.answers;
$("snap").innerHTML=[[2,"Mandatory registrations",n(2),"Open the planner →"],[1,"Conditional registrations",n(1),"Confirm thresholds →"],[4,"Registration readiness",(m.length?Math.round(dn/m.length*100):0)+"%",dn+" of "+m.length+" mandatory obtained"],[3,"Next registration to obtain",nx?nx.r.n:AccessProvider.isPremium()?"All mandatory items obtained":"Full report required","From your mandatory list"]].map(([k,t,v,s])=>`<div class="card rk k${k}" data-kf="${k===4||k===3?2:k}"><span>${t}</span><b style="font-size:${String(v).length>8?"14px":"30px"}">${v}</b><small>${s}</small></div>`).join("");
$("heroPills").innerHTML=[S[an.sector],an.state,n(2)+" mandatory registrations"].map(x=>`<span class="pill">${x}</span>`).join("")}
function printHtml(){return registrationPrintHtml(regPreview(true))}
function actionText(){return "Review the registration preview."}

function lu(){}


document.addEventListener("click",ev=>{const b=ev.target.closest("[data-rf],[data-rs],[data-d],[data-kf]");if(!b)return;
if(b.dataset.rf){F=b.dataset.rf;render()}
else if(b.dataset.rs){if(b.dataset.rs==="s")SS=!SS;else SI=!SI;render()}
else if(b.dataset.d){done[b.dataset.d]=!done[b.dataset.d];render();snap()}
else if(b.dataset.kf){F=b.dataset.kf;render();activateTab("registrations")}});
$("rgQ").addEventListener("input",ev=>{QS=ev.target.value;render()});
return{render,snap,lu,printHtml,actionText,getPreview:regPreview,hydrate:hydrateRegistrations,resetContent:resetRegistrationContent,reset(){for(const k in done)delete done[k];F="all";SS=SI=0;QS="";$("rgQ").value=""}}})();
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
function askCover(done){
 let s={};try{s=JSON.parse(localStorage.getItem("bm_cover")||"{}")}catch(e){}
 const esc=v=>String(v||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const w=document.createElement("div");w.className="bm-cover-modal";w.setAttribute("role","dialog");w.setAttribute("aria-modal","true");w.setAttribute("aria-labelledby","bmCvT");
 w.innerHTML='<form class="bm-cover-card"><div class="bm-cover-kicker">Personalise your report</div><h2 id="bmCvT">Who is this report for?</h2><p>These details appear on the PDF cover. They stay in your browser and are never uploaded.</p><label>Business name<input name="biz" maxlength="70" placeholder="e.g. Sharma Foods Pvt Ltd" value="'+esc(s.biz)+'"></label><label>Your name<input name="name" maxlength="60" placeholder="e.g. Priya Sharma" value="'+esc(s.name)+'"></label><label>City / State<input name="city" maxlength="50" placeholder="e.g. Pune, Maharashtra" value="'+esc(s.city)+'"></label><div class="bm-cover-btns"><button type="button" class="btn" data-skip>Skip</button><button type="submit" class="btn primary">Generate PDF</button></div></form>';
 document.body.appendChild(w);const f=w.querySelector("form");setTimeout(()=>f.elements.biz.focus(),30);
 const k=e=>{if(e.key==="Escape")close({})};
 const close=m=>{w.remove();document.removeEventListener("keydown",k);done(m)};document.addEventListener("keydown",k);
 w.querySelector("[data-skip]").onclick=()=>close({});
 f.onsubmit=e=>{e.preventDefault();const el=f.elements,m={biz:el.biz.value.trim(),name:el.name.value.trim(),city:el.city.value.trim()};try{localStorage.setItem("bm_cover",JSON.stringify(m))}catch(x){}close(m)};
}

function pdfNow(){
 if(!state.rec||!state.rec.key){toast(state.rec&&state.rec.conflict?"No compatible structure was identified, so the report cannot be built. Revise your Part 1 answers and regenerate.":"Please complete the assessment first.");return}
 if(!AccessProvider.isPremium()){
  if(window.BizPayments&&typeof window.BizPayments.openCheckout==="function")window.BizPayments.openCheckout();
  else{const buy=document.querySelector("[data-buy]");if(buy)buy.click();}
  return;
 }
 askCover(meta=>pdfBuild(meta));
}
function pdfBuild(meta){
 meta=meta||{};
 try{
  if(!window.jspdf||typeof window.jspdf.jsPDF!=="function")throw new Error("PDF engine unavailable");
  const ent=ENTITIES[state.rec.key];
  buildPrint(ent);
  const report=document.getElementById("printReport");
  if(!report||!report.innerHTML.trim())throw new Error("PDF report could not be prepared");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=40,tx=e=>pdfClean(e.textContent.replace(/\s+/g," ").trim());
  // Palette: refined green premium
  const C={forest:[10,30,42],emerald:[24,79,107],em2:[36,96,127],mint:[225,235,241],gold:[201,162,39],goldS:[246,235,200],ink:[27,34,41],muted:[92,97,104],line:[226,221,211],soft:[247,251,249],red:[185,28,28],redS:[254,226,226],amb:[184,110,0],ambS:[255,241,214]};
  const fill=c=>doc.setFillColor(...c),stroke=c=>doc.setDrawColor(...c),ink=c=>doc.setTextColor(...c);
  const PORTALS=[["MCA (Company / LLP incorporation)","https://www.mca.gov.in",/\b(MCA|SPICe|incorporat|ROC|DIN|LLP|DSC|AOC|MGT)\b/i],["GST registration","https://www.gst.gov.in",/\bGST/i],["Income Tax (PAN / TAN)","https://www.incometax.gov.in",/\b(PAN|TAN|income tax|TDS)\b/i],["Udyam (MSME)","https://udyamregistration.gov.in",/udyam|MSME/i],["FSSAI food licence","https://foscos.fssai.gov.in",/FSSAI|food licen/i],["EPFO (Provident Fund)","https://www.epfindia.gov.in",/EPF|provident/i],["ESIC","https://www.esic.gov.in",/ESIC|ESI\b/i],["DGFT (IEC)","https://www.dgft.gov.in",/IEC|DGFT|import/i],["Startup India / DPIIT","https://www.startupindia.gov.in",/DPIIT|startup india/i],["Shram Suvidha (labour)","https://shramsuvidha.gov.in",/labour|shops and establishment|shop.?act/i]];
  const portalFor=t=>{const p=PORTALS.find(p=>p[2].test(t));return p&&p[1]};
  const rid="BM-"+Date.now().toString(36).toUpperCase().slice(-6)+"-"+state.rec.key.slice(0,3).toUpperCase();
  let y=M,rows=[],checks=[],sec=0;const toc=[];
  const need=n=>{if(y+n>H-56){doc.addPage();y=M+16}};
  const badge=(d)=>{if(d.section!=="body")return;const t=String(d.cell.raw&&d.cell.raw.textContent!=null?d.cell.raw.textContent:d.cell.raw||"");
   if(/^\s*(mandatory|required|yes|critical|high)\b/i.test(t)){d.cell.styles.fillColor=C.redS;d.cell.styles.textColor=C.red;d.cell.styles.fontStyle="bold"}
   else if(/^\s*(conditional|medium|if applicable|depends)/i.test(t)){d.cell.styles.fillColor=C.ambS;d.cell.styles.textColor=C.amb;d.cell.styles.fontStyle="bold"}
   else if(/^\s*(optional|recommended|low|no)\b/i.test(t)){d.cell.styles.fillColor=C.mint;d.cell.styles.textColor=C.emerald;d.cell.styles.fontStyle="bold"}};
  const linkCell=d=>{if(d.section!=="body"||d.column.index>2)return;const t=(d.cell.text||[]).join(" "),u=portalFor(t);if(u){doc.link(d.cell.x,d.cell.y,d.cell.width,d.cell.height,{url:u})}};
  const tbl=(o,fs)=>{doc.autoTable({startY:y,margin:{left:M,right:M,top:M+16,bottom:56},theme:"grid",styles:{fontSize:fs||8,cellPadding:5,valign:"top",overflow:"linebreak",textColor:C.ink,lineColor:C.line,lineWidth:.5},headStyles:{fillColor:C.emerald,textColor:255,fontStyle:"bold"},alternateRowStyles:{fillColor:C.soft},didParseCell:d=>{d.cell.text=(d.cell.text||[]).map(pdfClean);badge(d);if(o.__pc)o.__pc(d)},didDrawCell:d=>{linkCell(d);if(o.__dc)o.__dc(d)},...o});y=doc.lastAutoTable.finalY+16};
  const flush=()=>{if(rows.length){tbl({body:rows,columnStyles:{0:{cellWidth:130,fontStyle:"bold",textColor:C.emerald}}});rows=[]}
   if(checks.length){const cs=checks;checks=[];tbl({head:[["","Document","Item"]],body:cs.map(c=>["",c[0],c[1]]),columnStyles:{0:{cellWidth:26},1:{cellWidth:120,fontStyle:"bold",textColor:C.emerald}},__dc:d=>{if(d.section==="body"&&d.column.index===0){const cb=new doc.AcroFormCheckBox();cb.fieldName="chk_"+d.row.index+"_"+doc.getNumberOfPages()+"_"+Math.round(d.cell.y);cb.x=d.cell.x+7;cb.y=d.cell.y+5;cb.width=11;cb.height=11;cb.appearanceState=cs[d.row.index][2]?"On":"Off";cb.value=cs[d.row.index][2]?"On":"Off";doc.addField(cb)}}})}};
  const pc=el=>{const h=el.querySelector("h4"),body=[...el.children].filter(c=>c.tagName!=="H4").map(c=>c.tagName==="UL"?[...c.children].map(li=>"• "+tx(li)).join("\n"):tx(c)).join("\n"),m=body.match(/^\s*\[(\s|Done)\]\s*/);
   if(m){checks.push([h?tx(h):"",body.slice(m[0].length),m[1]==="Done"]);return}rows.push([h?tx(h):"",body])};
  const head=(title)=>{sec++;need(80);const pg=doc.getNumberOfPages();toc.push([sec,title,pg,y]);doc.outline.add(null,sec+". "+title,{pageNumber:pg});
   fill(C.forest);doc.roundedRect(M,y,W-2*M,34,6,6,"F");fill(C.gold);doc.roundedRect(M+10,y+8,26,18,4,4,"F");ink(C.forest);doc.setFont(undefined,"bold");doc.setFontSize(10);doc.text(String(sec).padStart(2,"0"),M+23,y+20.5,{align:"center"});
   ink([255,255,255]);doc.setFontSize(13);doc.text(title,M+46,y+21.5);doc.setFont(undefined,"normal");y+=50};

  /* ---------- COVER ---------- */
  fill(C.forest);doc.rect(0,0,W,300,"F");fill(C.emerald);doc.triangle(W*.55,300,W,120,W,300,"F");fill(C.gold);doc.rect(0,300,W,4,"F");
  ink(C.gold);doc.setFontSize(9);doc.setFont(undefined,"bold");doc.text("BIZ MATRIX  •  STRUCTURE & REGISTRATION INTELLIGENCE  •  FY 2026-27",M,52);
  ink([255,255,255]);doc.setFontSize(11);doc.setFont(undefined,"normal");doc.text("Recommended business structure",M,96);
  doc.setFontSize(30);doc.setFont(undefined,"bold");const tl=doc.splitTextToSize(pdfClean(ent.name),W*.55);doc.text(tl,M,128);doc.setFont(undefined,"normal");
  let py=128+tl.length*32+8;if(meta.biz||meta.name){ink(C.gold);doc.setFontSize(9);doc.setFont(undefined,"bold");doc.text("PREPARED FOR",M,py+4);doc.setFont(undefined,"normal");ink([255,255,255]);doc.setFontSize(15);doc.text(doc.splitTextToSize(pdfClean(meta.biz||meta.name),W*.55)[0],M,py+22);const sub=[meta.biz?meta.name:"",meta.city].filter(Boolean).map(pdfClean).join("  \u2022  ");if(sub){ink([200,216,228]);doc.setFontSize(10);doc.text(sub,M,py+37)}py+=52}
  ink([200,216,228]);doc.setFontSize(10);doc.text("Prepared "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})+"   |   Report ID "+rid,M,py);
  // Fit gauge
  const gx=W-M-80,gy=170,gr=58,only=state.rec.confidence==="only eligible structure",fit=only?100:(state.rec.fit||0);doc.setLineWidth(10);stroke([40,70,92]);doc.circle(gx,gy,gr,"S");
  stroke(C.gold);const a0=-Math.PI/2,steps=60;for(let i=0;i<steps*fit/100;i++){const a=a0+i/steps*2*Math.PI,b=a0+(i+1.05)/steps*2*Math.PI;doc.line(gx+gr*Math.cos(a),gy+gr*Math.sin(a),gx+gr*Math.cos(b),gy+gr*Math.sin(b))}
  doc.setLineWidth(.5);ink([255,255,255]);doc.setFont(undefined,"bold");doc.setFontSize(26);doc.text(only?"ONLY":String(fit),gx,gy+6,{align:"center"});doc.setFont(undefined,"normal");doc.setFontSize(8);ink(C.goldS);doc.text(only?"ELIGIBLE STRUCTURE":"FIT SCORE / 100",gx,gy+22,{align:"center"});doc.setFontSize(7.5);doc.text(pdfClean(confidenceLabel()).toUpperCase(),gx,gy+34,{align:"center"});
  // Ranking chart
  y=332;ink(C.forest);doc.setFont(undefined,"bold");doc.setFontSize(12);doc.text("How the structures compare",M,y);doc.setFont(undefined,"normal");y+=16;
  const rk=state.rec.ranking.filter(r=>r[1]!=null).slice(0,7),mx=rk.length?rk[0][1]:0,mn=rk.length?Math.min(...rk.map(r=>r[1])):0,bw=W-2*M-210;
  if(rk.length<2){ink(C.muted);doc.setFontSize(9);doc.text(doc.splitTextToSize("Only one structure passes the legal hard rules for your answers, so no weighted comparison is shown. See 'How We Decided' for the rules that excluded the others.",W-2*M),M,y+8);y+=30}
  rk.forEach(([k,v],i)=>{const pct=mx===mn?1:.25+.75*(v-mn)/(mx-mn),top=i===0;ink(top?C.emerald:C.muted);doc.setFontSize(9);if(top)doc.setFont(undefined,"bold");doc.text(pdfClean((ENTITIES[k]||{}).name||k),M,y+10);doc.setFont(undefined,"normal");
   fill([235,241,238]);doc.roundedRect(M+150,y+2,bw,10,5,5,"F");fill(top?C.emerald:[157,188,207]);doc.roundedRect(M+150,y+2,Math.max(10,bw*pct),10,5,5,"F");if(top){fill(C.gold);doc.circle(M+150+Math.max(10,bw*pct)-5,y+7,3,"F")}ink(top?C.emerald:C.muted);doc.setFontSize(9);doc.text(v.toFixed(1),W-M,y+10,{align:"right"});y+=19});
  y+=12;
  const cover=report.querySelector(".print-cover");
  if(cover){tbl({head:[["Key metric","Value"]],body:[...cover.querySelectorAll(".pkpi")].map(k=>[tx(k.querySelector(".pkpi-label")),tx(k.querySelector(".pkpi-value"))]),columnStyles:{0:{cellWidth:150,fontStyle:"bold",textColor:C.emerald}}});cover.querySelectorAll(".pcard").forEach(pc);flush()}
  /* ---------- CONTENTS placeholder ---------- */
  doc.addPage();const tocPage=doc.getNumberOfPages();doc.outline.add(null,"Contents",{pageNumber:tocPage});
  doc.addPage();y=M+16;
  /* ---------- SECTIONS ---------- */
  report.querySelectorAll(".print-page").forEach(pg=>{
   if(pg.classList.contains("print-cover"))return;
   const st=pg.querySelector(".print-section-title");if(st)head(tx(st));
   [...pg.children].forEach(el=>{
    if(el===st||el.classList.contains("print-foot"))return;
    if(el.classList.contains("print-grid2"))el.querySelectorAll(".pcard").forEach(pc);
    else if(el.classList.contains("pcard"))pc(el);
    else if(el.tagName==="TABLE"){flush();const nc=el.rows[0].cells.length,reg=nc===5&&/Registration/.test(el.rows[0].textContent),comp6=nc===6&&/Default timing/.test(el.rows[0].textContent);tbl({html:el,columnStyles:reg?{0:{cellWidth:24},1:{cellWidth:92,textColor:C.emerald,fontStyle:"bold"},2:{cellWidth:56},4:{cellWidth:84}}:comp6?{0:{cellWidth:48},1:{cellWidth:70},2:{cellWidth:86},3:{cellWidth:105},4:{cellWidth:120},5:{cellWidth:85}}:{0:{fontStyle:"bold",textColor:C.emerald}}},nc>=7?6.5:8)}
    else{flush();const t=tx(el);if(t){need(34);fill(C.goldS);const ln=doc.splitTextToSize(t,W-2*M-20);doc.roundedRect(M,y,W-2*M,ln.length*11+12,4,4,"F");fill(C.gold);doc.rect(M,y,3,ln.length*11+12,"F");doc.setFontSize(8.5);ink(C.ink);doc.text(ln,M+12,y+14);y+=ln.length*11+22}}
   });flush();y+=6
  });
  /* ---------- PORTALS ---------- */
  head("Official Portals & Next Steps");doc.setFontSize(9);ink(C.muted);doc.text("Click any portal to open it. Registration names in the tables above are also clickable where a portal applies.",M,y);y+=14;
  tbl({head:[["Portal","Link"]],body:PORTALS.map(p=>[p[0],p[1].replace("https://","")]),columnStyles:{0:{cellWidth:200,fontStyle:"bold"},1:{textColor:C.emerald}},__dc:d=>{if(d.section==="body")doc.link(d.cell.x,d.cell.y,d.cell.width,d.cell.height,{url:PORTALS[d.row.index][1]})}});
  /* ---------- CONTENTS fill ---------- */
  doc.setPage(tocPage);fill(C.forest);doc.rect(0,0,W,110,"F");fill(C.gold);doc.rect(0,110,W,3,"F");ink([255,255,255]);doc.setFont(undefined,"bold");doc.setFontSize(24);doc.text("Contents",M,70);doc.setFont(undefined,"normal");ink(C.goldS);doc.setFontSize(9);doc.text("Click a section to jump to it. Use the PDF bookmarks panel to navigate at any time.",M,90);
  let ty=150;toc.forEach(([n,t,p,yy])=>{fill(n%2?C.soft:[255,255,255]);doc.rect(M,ty-14,W-2*M,24,"F");fill(C.emerald);doc.roundedRect(M+8,ty-9,22,15,3,3,"F");ink([255,255,255]);doc.setFontSize(8);doc.setFont(undefined,"bold");doc.text(String(n).padStart(2,"0"),M+19,ty+1,{align:"center"});
   ink(C.ink);doc.setFontSize(11);doc.text(t,M+42,ty+2);doc.setFont(undefined,"normal");ink(C.emerald);doc.text(String(p),W-M-10,ty+2,{align:"right"});stroke(C.line);doc.setLineDashPattern([1,2],0);doc.line(M+48+doc.getTextWidth(t)+6,ty+2,W-M-28,ty+2);doc.setLineDashPattern([],0);
   doc.link(M,ty-14,W-2*M,24,{pageNumber:p,top:yy});ty+=28});
  /* ---------- HEADERS / FOOTERS ---------- */
  const n=doc.getNumberOfPages();
  for(let i=2;i<=n;i++){doc.setPage(i);if(i!==tocPage){fill(C.emerald);doc.rect(0,0,W,4,"F");doc.setFontSize(7.5);ink(C.muted);doc.text("BIZ MATRIX  |  "+pdfClean(ent.name).toUpperCase(),M,22);ink(C.emerald);doc.text("Back to contents",W-M,22,{align:"right"});doc.link(W-M-70,13,70,12,{pageNumber:tocPage})}
   stroke(C.line);doc.setLineWidth(.5);doc.line(M,H-38,W-M,H-38);doc.setFontSize(7.5);ink(C.muted);doc.text("Decision support, law verified "+BizEngine.VERIFIED+". Not legal, tax or professional advice.  |  Engine v"+BizEngine.VERSION+"  |  "+rid,M,H-24);fill(C.emerald);doc.roundedRect(W-M-54,H-33,54,14,7,7,"F");ink([255,255,255]);doc.text(i+" / "+n,W-M-27,H-23,{align:"center"})}
  doc.setProperties({title:"Biz Matrix Report - "+(meta.biz?pdfClean(meta.biz)+" - ":"")+pdfClean(ent.name),subject:"Business structure & registration intelligence",author:"Biz Matrix",creator:"Biz Matrix"});
  window.__lastPdf=doc;
  const blob=doc.output("blob");
  if(!blob||!blob.size)throw new Error("Empty PDF generated");
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="Biz_Matrix_"+((meta.biz||"").replace(/[^A-Za-z0-9]+/g,"_").replace(/^_|_$/g,"")||"Full_Report")+".pdf";a.style.display="none";document.body.appendChild(a);a.click();
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
