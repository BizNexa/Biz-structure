// Property tests. All are checked on generated inputs, not hand-picked ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rupees, toRupees, computeIndividual, computeFirm, computeCompany, type IndividualInput, type Regime } from '../src/engine/index.ts';
import { loadRules, seeded } from './helpers.ts';

const R = loadRules();
const STEP = rupees(10);
const person = (extra: Partial<IndividualInput>): IndividualInput => ({ kind: 'individual', resident: true, age: 30, ...extra });

function both(input: IndividualInput) {
  const r = computeIndividual(input, R);
  if (r.status !== 'ok') throw new Error(r.reason);
  return r.results;
}
/** Income-tax plus surcharge, before cess. */
const preCess = (input: IndividualInput, regime: Regime) => { const x = both(input)[regime]; return x.liability.total - x.liability.cess; };

/*
 * "Post-tax income never falls when income rises" is tested on income-tax + surcharge BEFORE cess, and not
 * at the old-regime rebate limit. Two features of the law make the literal property false:
 *   1. Inside a marginal-relief band tax + surcharge rises rupee for rupee, and 4% cess is charged on top.
 *   2. The old-regime rebate (s.156(1)) ends at Rs. 5,00,000 with no marginal relief.
 * Both are demonstrated explicitly at the end of this file so the exclusions are not silent.
 */
test('tax + surcharge never rises by more than the rise in income (individual, both regimes)', () => {
  const sweeps: { label: string; centres: number[]; make: (i: number) => IndividualInput }[] = [
    { label: 'business only', centres: [1200000, 5000000, 10000000, 20000000, 50000000], make: (i) => person({ businessIncome: i }) },
    { label: 'senior, business only', centres: [5000000, 10000000, 20000000, 50000000], make: (i) => person({ age: 65, businessIncome: i }) },
    { label: 'business + s.196 gains 3 crore + dividend 50 lakh', centres: [20000000, 50000000],
      make: (i) => person({ businessIncome: i, gains: { stcgListedEquity196: rupees(30000000) }, other: { dividend: rupees(5000000) } }) },
    { label: 'business + s.198 gains 40 lakh', centres: [1000000, 6000000, 16000000],
      make: (i) => person({ businessIncome: i, gains: { ltcgListedEquity198: rupees(4000000) } }) },
    { label: 'business + lottery 30 lakh', centres: [2000000, 7000000, 17000000], make: (i) => person({ businessIncome: i, winnings: { lotteryEtc: rupees(3000000) } }) },
    { label: 'HUF, business only', centres: [5000000, 10000000, 20000000, 50000000], make: (i) => ({ kind: 'huf', resident: true, businessIncome: i }) },
  ];
  let checks = 0;
  for (const s of sweeps) for (const centre of s.centres) for (const regime of ['new', 'old'] as const) {
    let prev = preCess(s.make(rupees(centre - 1500)), regime);
    for (let i = rupees(centre - 1500) + STEP; i <= rupees(centre + 2500); i += STEP) {
      const cur = preCess(s.make(i), regime);
      assert.ok(cur - prev <= STEP, `${s.label}, ${regime}, income ${toRupees(i)}: tax rose by ${toRupees(cur - prev)} for Rs. 10 more income`);
      assert.ok(cur >= prev, `${s.label}, ${regime}, income ${toRupees(i)}: tax fell as income rose`);
      prev = cur; checks++;
    }
  }
  assert.ok(checks > 15000);
});

test('tax + surcharge never rises by more than the rise in income (firm and company thresholds)', () => {
  const firm = (i: number) => { const r = computeFirm({ resident: true, normalIncome: i }, R); assert.ok(r.status === 'ok'); return r.liability.total - r.liability.cess; };
  const company = (i: number) => { const r = computeCompany({ resident: true, companyType: 'private', regime: 'normal', normalIncome: i, bookProfit: 0, turnoverTaxYear2024_25: 0 }, R); assert.ok(r.status === 'ok'); return r.liability.total - r.liability.cess; };
  for (const [name, fn, centres] of [['firm', firm, [10000000]], ['company', company, [10000000, 100000000]]] as const) {
    for (const centre of centres) {
      let prev = fn(rupees(centre - 1500));
      for (let i = rupees(centre - 1500) + STEP; i <= rupees(centre + 2500); i += STEP) {
        const cur = fn(i);
        assert.ok(cur - prev <= STEP && cur >= prev, `${name}, income ${toRupees(i)}: change ${toRupees(cur - prev)}`);
        prev = cur;
      }
    }
  }
});

function randomPerson(rand: () => number): IndividualInput {
  let shrink = 1;
  const amount = (max: number) => (rand() < 0.35 ? 0 : rupees(Math.floor(rand() * max * shrink)));
  const tier = rand();
  const big = tier < 0.3;
  const small = tier > 0.6;
  const scale = small ? 0.08 : 1;
  shrink = scale;
  return {
    kind: rand() < 0.25 ? 'huf' : 'individual', resident: true, age: 20 + Math.floor(rand() * 75),
    salary: { gross: amount(big ? 80000000 : 4000000), professionalTax: amount(2500) },
    businessIncome: amount(big ? 90000000 : 3000000),
    familyPension: amount(300000),
    house: { letOutNetAnnualValue: amount(1000000), letOutInterest: amount(1500000), selfOccupiedInterest: amount(400000), selfOccupiedHigherLimit: rand() < 0.5 },
    other: { savingsInterest: amount(60000), depositInterest: amount(800000), dividend: amount(big ? 40000000 : 500000), otherIncome: amount(500000) },
    gains: { stcgListedEquity196: amount(big ? 60000000 : 800000), ltcgListedEquity198: amount(big ? 60000000 : 800000), ltcgOther197: amount(big ? 60000000 : 800000), stcgOtherNormalRate: amount(500000) },
    winnings: { lotteryEtc: amount(500000), onlineGames: amount(200000), vda: amount(500000) },
    deductions: { s123: amount(250000), pensionOwn124_3: amount(80000), healthSelfFamily: amount(60000), healthParents: amount(60000), healthParentsSenior: rand() < 0.5,
      donationsFull: amount(300000), donationsHalfWithLimit: amount(300000), rentPaid134: amount(240000), educationLoanInterest: amount(200000) },
  };
}

test('on 3,000 random taxpayers: tax is never negative, is a multiple of Rs. 10, HUF never gets rebate, new-regime surcharge never exceeds 25%', () => {
  const rand = seeded(20261112);
  let hufSeen = 0; let surchargedNew = 0; let rebated = 0;
  for (let k = 0; k < 3000; k++) {
    const input = randomPerson(rand);
    const res = both(input);
    for (const regime of ['new', 'old'] as const) {
      const x = res[regime];
      const l = x.liability;
      assert.ok(x.taxPayable >= 0, `case ${k} ${regime}: negative tax`);
      assert.equal(x.taxPayable % rupees(10), 0, `case ${k} ${regime}: tax not a multiple of Rs. 10`);
      assert.equal(x.totalIncome % rupees(10), 0, `case ${k} ${regime}: total income not a multiple of Rs. 10`);
      assert.ok(l.rebate >= 0 && l.surcharge >= 0 && l.marginalRelief >= 0 && l.cess >= 0, `case ${k} ${regime}: negative component`);
      assert.ok(l.rebate <= l.base.total, `case ${k} ${regime}: rebate exceeds tax`);
      if (input.kind === 'huf') { assert.equal(l.rebate, 0, `case ${k} ${regime}: HUF received a rebate`); hufSeen++; }
      if (l.rebate > 0) rebated++;
    }
    const n = res.new.liability;
    const taxAfterRebate = n.base.total - n.rebate;
    // Allow one paisa per component for rounding of the percentage.
    assert.ok(n.surcharge * 100 <= taxAfterRebate * 25 + 200, `case ${k}: new-regime surcharge above 25% of tax`);
    if (n.surcharge > 0) surchargedNew++;
    assert.ok(res.new.liability.rebate <= res.new.liability.base.slabTax, `case ${k}: new-regime rebate exceeded slab-rate tax`);
    assert.ok(res.new.chapterVIIIDeductions <= res.old.chapterVIIIDeductions + rupees(1), `case ${k}: new regime allowed more Chapter VIII deductions than old`);
  }
  // Guard against the generator never reaching the interesting branches.
  assert.ok(hufSeen > 500 && surchargedNew > 300 && rebated > 100, `coverage too thin: huf ${hufSeen}, surcharged ${surchargedNew}, rebated ${rebated}`);
});

test('the recommended regime is never the costlier one, and the saving equals the difference', () => {
  const rand = seeded(7);
  for (let k = 0; k < 500; k++) {
    const r = computeIndividual(randomPerson(rand), R);
    assert.ok(r.status === 'ok');
    const other = r.recommended === 'new' ? 'old' : 'new';
    assert.ok(r.results[r.recommended].taxPayable <= r.results[other].taxPayable);
    assert.equal(r.saving, r.results[other].taxPayable - r.results[r.recommended].taxPayable);
  }
});

test('documented exception 1: with cess, post-tax income can fall inside a marginal-relief band', () => {
  const pay = (i: number) => both(person({ businessIncome: rupees(i) })).new.taxPayable;
  // 5,00,000 more income in the 50-lakh band costs more than... no: it costs exactly the extra income plus 4% cess on it.
  const extraIncome = 100000;
  const extraTax = toRupees(pay(5000000 + extraIncome) - pay(5000000));
  assert.equal(extraTax, extraIncome * 1.04);
});

test('documented exception 2: old-regime rebate ends at Rs. 5,00,000 without marginal relief', () => {
  const pay = (i: number) => both(person({ businessIncome: rupees(i) })).old.taxPayable;
  assert.equal(toRupees(pay(500000)), 0);
  assert.equal(toRupees(pay(500010)), 13000);
});

test('documented exception 3 (assumption Z-05): when a 20% capital gain grows across a threshold while normal income sits in a 10% slab, tax rises Rs. 11 per Rs. 10', () => {
  // Marginal relief takes "tax at the threshold" by removing normal income first. Removing Rs. 10 taxed at 10% while the
  // extra Rs. 10 is taxed at 20% leaves Rs. 1 outside the relief. Raised with the CA as OPEN_QUESTIONS Q27.
  const make = (total: number) => person({ businessIncome: rupees(1000000), gains: { stcgListedEquity196: rupees(total - 1000000) } });
  const rise = preCess(make(5000010), 'new') - preCess(make(5000000), 'new');
  assert.equal(toRupees(rise), 11);
  // The overshoot is bounded by the rate difference, never the surcharge itself.
  for (const centre of [5000000, 10000000, 20000000]) for (const regime of ['new', 'old'] as const) {
    let prev = preCess(make(centre - 1500), regime);
    for (let t = centre - 1490; t <= centre + 2500; t += 10) {
      const cur = preCess(make(t), regime);
      assert.ok(cur >= prev && cur - prev <= rupees(12), `${regime}, total income ${t}: change ${toRupees(cur - prev)}`);
      prev = cur;
    }
  }
});
