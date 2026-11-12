const fs=require('fs'),path=require('path');
const root=process.argv[2];
const j=JSON.parse(fs.readFileSync(path.join(root,'rules/ty2026-27.json'),'utf8'));
const esc=s=>String(s).replace(/\|/g,'&#124;').replace(/\n/g,' ');
const inr=n=>{const s=String(n);if(s.length<=3)return s;const l=s.slice(-3);return s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+l;};
const show=v=>{if(v===null)return 'none';if(typeof v==='number')return Number.isInteger(v)&&v>=1000?inr(v):String(v);if(typeof v==='boolean')return v?'Yes':'No';if(typeof v==='string')return v;
 if(Array.isArray(v))return v.map(x=>typeof x==='object'?show(x):x).join('; ');
 return Object.entries(v).map(([k,x])=>`${k.replace(/_/g,' ')}: ${typeof x==='object'&&x!==null?'('+show(x)+')':show(x)}`).join('; ');};
const srcName={ACT:'Act PDF',RULES:'Rules PDF','FA26-S3':'FA 2026 s.3 (CBDT site)','FA26-SCH1':'FA 2026 First Sch. Pt I-B (CBDT site)','ACT + FA26-S3':'Act PDF + FA 2026 s.3 (site)','FA26-SCH1 + FA26-S3':'FA 2026 First Sch. + s.3 (site)',brief:'Project brief',decision:'Decision log'};
let o=[];
o.push(`# RULES_REVIEW — Tax Year 2026-27 (Income-tax Act, 2025 as amended by Finance Act, 2026)

**Status: DRAFT for CA verification. Nothing below is approved. No calculator code has been written.**
Generated from \`rules/ty2026-27.json\` on ${j.meta.extracted_on} — ${j.rules.length} rules. The JSON is the single source; this table is rendered from it.

## How to review
- Tick the first column (\`☐\` → \`☑\`) for each line you accept; write corrections against the ID.
- **Page** = PDF page index of the file in \`./reference/\` (not a printed folio). "site" = read from the CBDT Finance Acts viewer, see source note 2.
- **1961 Act** column is *indicative only* — it comes from my general knowledge, not from your reference files (except s.194, where the Act prints it). Please check it against the CBDT navigator utility.
- Extracts are verbatim. All Act-PDF extracts were machine-matched against the PDF text after writing (102 of 103 matched automatically; C-15 failed only on a dash character and was confirmed by eye). Finance Act extracts were copied from the site text and are not machine-checked. The rupee glyph is shown as "Rs.".

## Sources actually used
1. \`reference/Income_Tax_Act_2025_as_amended_by_FA_Act_2026.pdf\` (686 pp.) — primary.
2. **Finance Act, 2026 — section 3 and First Schedule Part I-B**, read on ${j.meta.extracted_on} from https://www.incometaxindia.gov.in/finance-acts. This is *not* a file in \`./reference/\`. The old-regime slabs, every surcharge slab, marginal relief, cess, and the firm and company base rates exist only there — the Act PDF merely says "rates in force". You accepted this source on 2026-11-11; the values themselves still need your tick. ${j.rules.filter(r=>r.src.includes('FA26')).length} lines depend on it.
3. \`reference/Income-tax-Rules-2026_…pdf\` (424 pp.) — Rule 135 (online-game net winnings) only.
4. \`reference/FAQs-on-Interplay-and-Transition.pdf\` (99 pp.) — searched; contains no rates, surcharge or cess. Not relied on. No Act-vs-FAQ conflict found.

## Lines that need your attention first
| ID | Why |
|---|---|
| A-16 | Old-regime rebate is barred only against s.198 LTCG tax, not against other special-rate tax. Differs from the brief's expectation. |
| A-57 | Unexplained-income rate cut from 60% to 30% by Finance Act 2026 (surcharge 25%). |
| A-58 | Finance Act 2026 removed every deduction against dividend income (the 20% interest allowance is gone). |
| A-62 | 15% surcharge cap covers all s.197 LTCG, not only listed-equity gains. |
| A-67 | AMT credit for non-corporates is untouched; only MAT credit was withdrawn. |
| C-01 | Turnover test refers to **tax year 2024-25**, threshold Rs. 400 crore. |
| C-06 | s.201 (15%) needs manufacture commenced by 31-3-2024 — closed to new companies. |
| C-07 | Flat surcharge row was amended by the *Taxation and Other Laws (Amendment) Act, 2026* (SPV at 25%) — an amending Act not in your reference set. |
| C-10, C-13, C-14 | MAT 14%; MAT final with no new credit; old credit usable only after opting for s.200/201, capped at 25% of tax payable. |
| C-17, C-18 | Buy-back now capital gains, with additional tax on promoters. |
| D-02 | Rate on a registered Section 8 company's taxable regular income is not stated in Part XVII-B itself. |
| E-09 | Deferment interest is written as flat 3% / 3% / 3% / 1% of the shortfall. |
`);
let g=null;
for(const r of j.rules){ if(r.group!==g){g=r.group;o.push(`\n## ${g}\n\n| ✔ | ID | Rule | Value | 2025 Act | 1961 Act (indicative) | Source, page | Verbatim extract |\n|---|---|---|---|---|---|---|---|`);}
 o.push(`| ☐ | ${r.id} | ${esc(r.desc)} | ${esc(r.display||show(r.value))} | ${esc(r.sec2025)} | ${esc(r.sec1961)} | ${srcName[r.src]||r.src}, ${r.page==='web'?'site':'p.'+r.page} | "${esc(r.extract)}" |`);}
o.push(`\n---\nOpen points are in \`OPEN_QUESTIONS.md\`. Phase 1 starts only after your sign-off on this table.\n`);
fs.writeFileSync(path.join(root,'rules/RULES_REVIEW.md'),o.join('\n'));
const byG={};j.rules.forEach(r=>byG[r.group]=(byG[r.group]||0)+1);console.log(byG);
