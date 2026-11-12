// One-off: adds presumptive-income (s.58) and arrears-of-rent (s.23) rules. Safe to re-run.
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'rules', 'ty2026-27.json');
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const add = [
  { id: 'A-69', group: 'A7. Old regime — deductions with caps', desc: 'Arrears of rent / unrealised rent received — taxable as house property in the year of receipt, less 30% (both regimes)',
    value: { deduction_pct: 30 }, sec2025: '23(1), 23(3)', sec1961: '25A', src: 'ACT', page: '54',
    extract: 'A sum equal to 30% of the arrears of rent or the unrealised rent referred to in sub-section (1) shall be allowed as deduction.' },
  { id: 'P-01', group: 'P. Presumptive income (s.58)', desc: 'Presumptive business income — eligible assessee (resident individual, HUF or firm other than LLP; no Chapter VIII-C claim; not a specified profession, commission, brokerage or agency)',
    value: { digital_pct: 6, other_pct: 8, turnover_limit: 20000000, turnover_limit_low_cash: 30000000, cash_limit_pct_of_turnover: 5, basis: 'higher of presumptive amount and profit actually earned' },
    display: '6% of receipts by banking/online mode + 8% of other receipts, or actual profit if higher. Turnover up to 2 crore, or 3 crore where cash receipts do not exceed 5%.',
    sec2025: '58(2) Table Sl.1; 58(11)(a)', sec1961: '44AD', src: 'ACT', page: '104, 106-107',
    extract: '6 % of total turnover or gross receipts which is received by specified banking or online mode … 8 % of total turnover or gross receipts as reduced by the turnover or gross receipts covered in (i)' },
  { id: 'P-02', group: 'P. Presumptive income (s.58)', desc: 'Presumptive income from specified profession (s.62(4)) — specified assessee (resident individual or firm other than LLP; not HUF)',
    value: { pct: 50, receipts_limit: 5000000, receipts_limit_low_cash: 7500000, cash_limit_pct_of_receipts: 5, basis: 'higher of 50% and profit actually earned' },
    display: '50% of gross receipts, or actual profit if higher. Receipts up to 50 lakh, or 75 lakh where cash receipts do not exceed 5%.',
    sec2025: '58(2) Table Sl.3; 58(11)(b)', sec1961: '44ADA', src: 'ACT', page: '105, 107',
    extract: '50% of the gross receipts or profit claimed to have been actually earned, whichever is higher.' },
  { id: 'P-03', group: 'P. Presumptive income (s.58)', desc: 'Goods-carriage presumption (s.58(2) Table Sl.2) — NOT COVERED in this version', value: { covered: false },
    sec2025: '58(2) Table Sl.2', sec1961: '44AE', src: 'ACT', page: '104-105',
    extract: 'being a heavy goods vehicle, calculated at the rate of Rs. 1000 per ton of gross vehicle weight' },
];
let added = 0;
for (const r of add) if (!j.rules.some((x) => x.id === r.id)) { j.rules.push(r); added++; }
fs.writeFileSync(p, JSON.stringify(j, null, 1));
console.log(`added ${added}, rules now ${j.rules.length}`);
