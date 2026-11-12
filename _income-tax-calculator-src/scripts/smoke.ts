// Phase 1 smoke run: a handful of hand-computed cases to prove the engine runs end to end.
// This is NOT the Phase 2 test suite. Every expected figure here is UNVERIFIED — CA to confirm.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRules, rupees, toRupees, computeIndividual, computeFirm, computeCompany, computeSection8,
  computeAdvanceTax, partnerRemuneration, type IndividualInput, type RawRuleFile,
} from '../src/engine/index.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = buildRules(JSON.parse(fs.readFileSync(path.join(root, 'rules', 'ty2026-27.json'), 'utf8')) as RawRuleFile);

let failed = 0;
let passed = 0;
function expect(name: string, actualPaise: number, expectedRupees: number, working: string): void {
  const ok = actualPaise === rupees(expectedRupees);
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${toRupees(actualPaise)}, expected ${expectedRupees}   [${working}]`);
}
function ind(input: IndividualInput, regime: 'new' | 'old'): number {
  const r = computeIndividual(input, R);
  if (r.status !== 'ok') throw new Error(r.reason);
  return r.results[regime].taxPayable;
}
const person = (extra: Partial<IndividualInput>): IndividualInput => ({ kind: 'individual', resident: true, age: 30, ...extra });

// --- Individuals / HUF
expect('New regime, salary 12,75,000', ind(person({ salary: { gross: rupees(1275000) } }), 'new'), 0,
  'TI 12,00,000; slab tax 20,000+40,000 = 60,000; rebate 60,000');
expect('New regime, salary 12,85,000 (marginal rebate)', ind(person({ salary: { gross: rupees(1285000) } }), 'new'), 10400,
  'TI 12,10,000; slab tax 61,500; payable capped at excess 10,000; cess 400');
expect('Old regime, below 60, salary 10,50,000', ind(person({ salary: { gross: rupees(1050000) } }), 'old'), 117000,
  'TI 10,00,000; 12,500 + 1,00,000 = 1,12,500; cess 4,500');
expect('Old regime, age 65, business 10,00,000', ind(person({ age: 65, businessIncome: rupees(1000000) }), 'old'), 114400,
  '10,000 + 1,00,000 = 1,10,000; cess 4,400');
expect('Old regime, age 85, business 10,00,000', ind(person({ age: 85, businessIncome: rupees(1000000) }), 'old'), 104000,
  '20% of 5,00,000 = 1,00,000; cess 4,000');
expect('HUF, new regime, business 12,00,000 (no rebate)', ind({ kind: 'huf', resident: true, businessIncome: rupees(1200000) }, 'new'), 62400,
  '60,000; no rebate for HUF; cess 2,400');
expect('New regime, business 50,01,000 (marginal relief at 50 lakh)', ind(person({ businessIncome: rupees(5001000) }), 'new'), 1124240,
  'tax at 50L = 10,80,000; cap = 10,80,000 + 1,000 = 10,81,000; cess 43,240');
expect('Old regime, only STCG s.196 of 3,00,000', ind(person({ gains: { stcgListedEquity196: rupees(300000) } }), 'old'), 0,
  'shortfall 2,50,000; 20% of 50,000 = 10,000; rebate 10,000 (as the Act reads)');
expect('New regime, only STCG s.196 of 3,00,000', ind(person({ gains: { stcgListedEquity196: rupees(300000) } }), 'new'), 0,
  'shortfall 4,00,000 absorbs the whole gain');
expect('Old regime, business 6,00,000 + LTCG s.198 2,25,000', ind(person({ businessIncome: rupees(600000), gains: { ltcgListedEquity198: rupees(225000) } }), 'old'), 46800,
  '32,500 + 12.5% of 1,00,000 = 45,000; cess 1,800');
expect('New regime, lottery 1,00,000 only (no rebate against special rate)', ind(person({ winnings: { lotteryEtc: rupees(100000) } }), 'new'), 31200,
  '30% = 30,000; rebate limited to slab tax (nil); cess 1,200');

// --- Firm / LLP
const firm = computeFirm({ resident: true, normalIncome: rupees(10010000) }, R);
if (firm.status !== 'ok') throw new Error('firm');
expect('Firm, income 1,00,10,000 (marginal relief at 1 crore)', firm.taxPayable, 3130400,
  'tax 30,03,000 + 12% = 33,63,360; cap = 30,00,000 + 10,000 = 30,10,000; cess 1,20,400');
const rem = partnerRemuneration(rupees(1000000), rupees(900000), R);
expect('Partner remuneration limit, book profit 10,00,000', rem.maximumAllowable, 780000, '90% of 6,00,000 = 5,40,000; 60% of 4,00,000 = 2,40,000');

// --- Companies
const coBase = { resident: true, companyType: 'private' as const };
const c1 = computeCompany({ ...coBase, regime: 'normal', turnoverTaxYear2024_25: rupees(1000000000), normalIncome: rupees(5000000), bookProfit: 0 }, R);
if (c1.status !== 'ok') throw new Error('c1');
expect('Company, normal, turnover 100 crore, income 50,00,000', c1.taxPayable, 1300000, '25% = 12,50,000; cess 50,000');
const c2 = computeCompany({ ...coBase, regime: 's200', normalIncome: rupees(10000000) }, R);
if (c2.status !== 'ok') throw new Error('c2');
expect('Company, s.200, income 1,00,00,000', c2.taxPayable, 2516800, '22% = 22,00,000; surcharge 10% = 2,20,000; cess 96,800');
const c3 = computeCompany({ ...coBase, regime: 'normal', turnoverTaxYear2024_25: rupees(5000000000), normalIncome: rupees(1000000), bookProfit: rupees(10000000) }, R);
if (c3.status !== 'ok') throw new Error('c3');
expect('Company, MAT applies (income 10,00,000, book profit 1 crore)', c3.taxPayable, 1456000, 'normal 30% = 3,00,000 < MAT 14% = 14,00,000; cess 56,000');

// --- Section 8
const npo = computeSection8({ registeredNpo: true, resident: true, npo: {
  regularIncome: rupees(10000000), appliedForObjects: rupees(8000000), accumulated: rupees(500000),
  anonymousDonations: rupees(500000), totalDonationsReceived: rupees(4000000) } }, R);
if (npo.status !== 'ok' || !('specifiedIncome' in npo)) throw new Error(`npo: ${npo.status}`);
expect('Section 8 NPO, 85% met, anonymous donations 5,00,000', npo.taxPayable, 93600,
  'exempt = higher of 1,00,000 or 5% of 40,00,000 = 2,00,000; 30% of 3,00,000 = 90,000; cess 3,600');
const npoBlocked = computeSection8({ registeredNpo: true, resident: true, npo: { regularIncome: rupees(10000000), appliedForObjects: rupees(5000000) } }, R);
const blockedOk = npoBlocked.status === 'blocked';
if (blockedOk) passed++; else failed++;
console.log(`${blockedOk ? 'PASS' : 'FAIL'}  Section 8 NPO with taxable regular income is blocked pending Q16 (status: ${npoBlocked.status})`);

// --- Advance tax
const adv = computeAdvanceTax({ taxPayable: rupees(100000) }, R);
expect('Advance tax, third instalment cumulative on 1,00,000', adv.schedule[2]?.cumulativeAmount ?? -1, 75000, '75% by 15 December');

// --- Non-resident
const nr = computeIndividual({ kind: 'individual', resident: false }, R);
const nrOk = nr.status === 'not_supported';
if (nrOk) passed++; else failed++;
console.log(`${nrOk ? 'PASS' : 'FAIL'}  Non-resident returns "not supported"`);

// --- Property: tax + surcharge (before cess) never rises by more than the rise in income.
// Cess is excluded on purpose: inside a marginal-relief band the law itself adds 4% cess on top of a 100% marginal charge.
function preCess(input: IndividualInput, regime: 'new' | 'old'): number {
  const r = computeIndividual(input, R);
  if (r.status !== 'ok') throw new Error(r.reason);
  const x = r.results[regime];
  return x.liability.total - x.liability.cess;
}
const step = rupees(10);
let checks = 0;
const violations: string[] = [];
const sweeps: { label: string; make: (income: number) => IndividualInput; centres: number[] }[] = [
  // The old-regime rebate limit (5,00,000) is deliberately not swept: s.156(1) gives no marginal relief there, so the cliff is statutory.
  { label: 'business income only', make: (i) => person({ businessIncome: i }), centres: [1200000, 5000000, 10000000, 20000000, 50000000] },
  { label: 'business + 3 crore s.196 gains + 50 lakh dividend', centres: [20000000, 50000000],
    make: (i) => person({ businessIncome: i, gains: { stcgListedEquity196: rupees(30000000) }, other: { dividend: rupees(5000000) } }) },
  { label: 'salary with 40 lakh s.198 gains', centres: [1000000, 6000000],
    make: (i) => person({ businessIncome: i, gains: { ltcgListedEquity198: rupees(4000000) } }) },
];
for (const s of sweeps) for (const centre of s.centres) for (const regime of ['new', 'old'] as const) {
  let prev = preCess(s.make(rupees(centre - 2000)), regime);
  for (let i = rupees(centre - 2000) + step; i <= rupees(centre + 3000); i += step) {
    const cur = preCess(s.make(i), regime);
    checks++;
    if (cur - prev > step) violations.push(`${s.label}, ${regime}, income ${toRupees(i)}: tax rose by ${toRupees(cur - prev)}`);
    prev = cur;
  }
}
if (violations.length === 0) passed++; else failed++;
console.log(`${violations.length === 0 ? 'PASS' : 'FAIL'}  Marginal-relief property: ${checks} Rs.10 steps around rebate and surcharge thresholds, ${violations.length} violations`);
for (const v of violations.slice(0, 8)) console.log('      ' + v);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
