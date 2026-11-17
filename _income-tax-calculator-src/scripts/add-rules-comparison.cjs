// One-off: adds the rules used by the Entity Tax Comparison tool (found in Step 0, 2026-11-17). Safe to re-run.
// Extracts are verbatim from reference/Income_Tax_Act_2025_as_amended_by_FA_Act_2026.pdf (PDF page index).
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'rules', 'ty2026-27.json');
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const G = 'F. Entity comparison (owner-level treatment, audit, TDS)';
const add = [
  { id: 'F-01', group: G, desc: "Partner's salary, bonus, commission or remuneration from the firm is NOT 'salary' (so no standard deduction)",
    value: { partner_remuneration_is_salary: false }, sec2025: '15(4)', sec1961: '', src: 'ACT', page: '42',
    extract: 'Any salary, bonus, commission or remuneration, by whatever name called, due to, or received by, a partner of a firm from the firm shall not be regarded as salary for the purposes of this section.' },
  { id: 'F-02', group: G, desc: "Interest, salary, bonus, commission or remuneration received by a partner from the firm is the partner's business income, to the extent allowed to the firm u/s 35(e)",
    value: { head: 'Profits and gains of business or profession', limited_to: 'amount allowed u/s 35(e)' }, sec2025: '26(2)(g)', sec1961: '', src: 'ACT', page: '56',
    extract: 'any interest, salary, bonus, commission or remuneration, by whatever name called, which is due to, or received by, a partner of a firm from such firm to the extent allowed under section 35( e ) as a deduction in computing the income of the firm' },
  { id: 'F-03', group: G, desc: "Partner's share in the total income of a firm separately assessed is not included in the partner's total income",
    value: { exempt: true, basis: 'profit-sharing ratio in the deed' }, sec2025: 'Schedule III Table Sl.2 (s.11)', sec1961: '', src: 'ACT', page: '600',
    extract: 'Any sum received by a partner towards his share in the total income of the firm. A person who is a part - ner of a firm separately assessed as such. The sum received as share in profit is as per the prof - it-sharing ratio provided in the partnership deed.' },
  { id: 'F-04', group: G, desc: 'No loss, allowance or deduction is allowed against presumptive income (so partner remuneration/interest cannot reduce it)',
    value: { deductions_against_presumptive: false }, sec2025: '58(4)', sec1961: '', src: 'ACT', page: '106',
    extract: 'Any loss, allowance or deduction allowable under the provisions of this Act, shall not be allowed against the income computed in the manner specified in sub-section (2).' },
  { id: 'F-05', group: G, desc: 'Presumptive business income: declaring profit outside the scheme within the next five years bars the scheme for the following five years',
    value: { lockout_years: 5 }, sec2025: '58(7)', sec1961: '', src: 'ACT', page: '106',
    extract: 'he declares profit for any of the five tax years succeeding such tax year in contravention of the provisions of sub-section (1), then he shall not be eligible to claim the benefit of the provisions of this section for five tax years subsequent to the tax year in which the profit has not been declared' },
  { id: 'F-06', group: G, desc: 'Tax audit thresholds',
    value: { business_turnover: 10000000, business_turnover_low_cash: 100000000, cash_limit_pct: 5, profession_receipts: 5000000 }, sec2025: '63(1) Table', sec1961: '', src: 'ACT', page: '113',
    extract: 'carrying on business shall, if his total sales, turnover or gross receipts, as the case may be, in business exceed or exceeds one crore rupees … clause ( a ) shall have effect as if for the words “one crore rupees”, the words “ten crore rupees” had been substituted; ( c ) carrying on profession shall, if his gross receipts in profession exceed fifty lakh rupees in any tax year.' },
  { id: 'F-07', group: G, desc: 'TDS on dividend paid by a domestic company; no TDS to an individual shareholder paid other than in cash up to Rs. 10,000 in the tax year',
    value: { rate_pct: 10, threshold: 0, individual_non_cash_exempt_upto: 10000 }, sec2025: '393(1) Table Sl.7; 393 Sl.10(f)', sec1961: '', src: 'ACT', page: '473, 488',
    extract: 'Any dividend (including div - idend on preference shares) declared. Any domestic company. Rate: 10% _______ Threshold limit: Nil.' },
  { id: 'F-08', group: G, desc: 'LLP statutory audit of accounts (LLP Act/Rules, not the Income-tax Act) — NEEDS VERIFICATION against the LLP Rules text',
    value: { turnover_over: 4000000, contribution_over: 2500000 }, sec2025: 'LLP Rules r.24(8)', sec1961: '', src: 'KB', page: '—',
    extract: 'BizMatrix knowledge base (saas-backend/private/catalog.json, compliance llp-I06): "If turnover > ₹40 lakh or contribution > ₹25 lakh". Not in ./reference.' },
];
let added = 0;
for (const r of add) if (!j.rules.some((x) => x.id === r.id)) { j.rules.push(r); added++; }
fs.writeFileSync(p, JSON.stringify(j, null, 1));
console.log(`added ${added}, rules now ${j.rules.length}`);
