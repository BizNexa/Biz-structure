// Entity Tax Comparison — hand-verified cases. Expected values are worked by hand from the rules file;
// if the engine disagrees, the test fails and the working below must be checked, never the expectation "fixed".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rupees, toRupees, computeFirm } from '../src/engine/index.ts';
import { compare, type CompareInput } from '../src/compare/compare.ts';
import { loadRules } from './helpers.ts';

const R = loadRules();
const L = (n: number) => rupees(n * 100000);
const card = (x: CompareInput, key: 'proprietor' | 'firm' | 'company') => {
  const c = compare(x, R).cards.find((k) => k.key === key)!;
  assert.ok(c.available, `${key} unavailable: ${c.reason}`);
  return c;
};
const one = (o: Partial<CompareInput> = {}): CompareInput => ({
  businessType: 'services', turnover: L(200), digitalPct: 100, profit: L(20), extractionPct: 100, presumptive: 'no',
  owners: [{ sharePct: 100, otherIncome: 0, regime: 'new' }], ...o,
});
const two = (o: Partial<CompareInput> = {}): CompareInput => ({
  ...one(), owners: [{ sharePct: 50, otherIncome: 0, regime: 'new' }, { sharePct: 50, otherIncome: 0, regime: 'new' }], ...o,
});

test('a) Proprietor, profit 20,00,000, new regime, no other income = 2,08,000', () => {
  // 4–8L 5% = 20,000; 8–12L 10% = 40,000; 12–16L 15% = 60,000; 16–20L 20% = 80,000 → 2,00,000; cess 4% = 8,000.
  const c = card(one(), 'proprietor');
  assert.equal(toRupees(c.totalTax), 208000);
});

test('b) Firm, 20,00,000 before remuneration, 2 equal partners, max remuneration 13,80,000 → total 1,93,440', () => {
  // Limit: first 6L → higher of 3L or 90% (5.4L) = 5,40,000; balance 14L × 60% = 8,40,000 → 13,80,000.
  // Firm income 6,20,000 × 30% = 1,86,000 + cess 7,440 = 1,93,440. Each partner 6,90,000: tax 14,500, rebate → nil.
  const c = card(two(), 'firm');
  assert.equal(toRupees(c.entityTax), 193440);
  assert.equal(toRupees(c.ownerTax), 0);
  assert.equal(toRupees(c.totalTax), 193440);
  assert.match(c.basis, /13,80,000/);
});

test('c) Pvt Ltd concessional, 20,00,000 fully retained = 5,03,360', () => {
  // 22% = 4,40,000; flat surcharge 10% = 44,000; cess 4% of 4,84,000 = 19,360.
  const c = card(one({ extractionPct: 0 }), 'company');
  assert.equal(toRupees(c.totalTax), 503360);
  assert.equal(toRupees(c.retained), 2000000 - 503360);
});

test('d1) Rebate marginal relief: proprietor income 12,10,000 → 10,400', () => {
  // Slab tax 61,500; excess over 12L = 10,000; rebate 51,500 → tax 10,000; cess 400.
  assert.equal(toRupees(card(one({ profit: rupees(1210000) }), 'proprietor').totalTax), 10400);
});

test('d2) Rebate edge: proprietor income exactly 12,00,000 → nil', () => {
  assert.equal(toRupees(card(one({ profit: L(12) }), 'proprietor').totalTax), 0);
});

test('d3) Surcharge edge: proprietor 50,00,000 → 11,23,200 (no surcharge at the threshold)', () => {
  // 3,00,000 up to 24L + 26L × 30% = 7,80,000 → 10,80,000; cess 43,200.
  assert.equal(toRupees(card(one({ profit: L(50) }), 'proprietor').totalTax), 1123200);
});

test('d4) Surcharge marginal relief: proprietor 50,10,000 → 11,33,600', () => {
  // Tax 10,83,000 + 10% surcharge 1,08,300 = 11,91,300; capped at 10,80,000 + 10,000 = 10,90,000; cess 43,600.
  assert.equal(toRupees(card(one({ profit: rupees(5010000) }), 'proprietor').totalTax), 1133600);
});

test('d5) Surcharge edge: proprietor 1,00,00,000 → 29,51,520', () => {
  // 3,00,000 + 76L × 30% = 25,80,000; surcharge 10% = 2,58,000 → 28,38,000; cess 1,13,520.
  assert.equal(toRupees(card(one({ profit: L(100) }), 'proprietor').totalTax), 2951520);
});

test('d6) Firm surcharge marginal relief at 1,01,00,000 → 32,24,000; at 1,00,00,000 → 31,20,000', () => {
  // 1.01 Cr × 30% = 30,30,000 + 12% = 33,93,600; capped at 30,00,000 + 1,00,000 = 31,00,000; cess 1,24,000.
  const at = (inc: number) => { const f = computeFirm({ resident: true, normalIncome: rupees(inc) }, R); assert.ok(f.status === 'ok'); return toRupees(f.taxPayable); };
  assert.equal(at(10100000), 3224000);
  assert.equal(at(10000000), 3120000);
});

test('d7) 44AD is not available to an LLP (engine warns), and the firm card never applies it', () => {
  const f = computeFirm({ resident: true, normalIncome: 0, isLlp: true, presumptive: { businessDigitalReceipts: L(50), businessOtherReceipts: 0, businessCashReceipts: 0 } }, R);
  assert.ok(f.status === 'ok' && f.warnings.some((w) => /limited liability partnership is not eligible/i.test(w)));
  const c = card(two({ turnover: L(50), presumptive: 'auto' }), 'firm');
  assert.equal(toRupees(c.totalTax), 193440); // books basis only, as in case b
  assert.ok(c.notes.some((n) => /LLP cannot use presumptive/.test(n)));
});

test('d8) Turnover above the presumptive limit: no presumptive alternative is offered', () => {
  // 2.5 Cr with 50% cash: limit is 2 Cr (cash > 5%).
  const c = card(one({ businessType: 'trading', turnover: L(250), digitalPct: 50, presumptive: 'auto' }), 'proprietor');
  assert.equal(c.alternative, undefined);
  assert.ok(c.notes.some((n) => /not available/.test(n)));
});

test('d9) Presumptive never lowers tax below actual profit: books chosen when actual profit is below the deemed 6%', () => {
  // Turnover 1 Cr all digital → deemed 6,00,000; actual 4,00,000 → books tax nil; presumptive tax on 6L: 10,000 → rebate → nil.
  const c = card(one({ businessType: 'trading', turnover: L(100), profit: L(4), presumptive: 'auto' }), 'proprietor');
  assert.equal(toRupees(c.totalTax), 0);
  assert.ok(c.alternative && toRupees(c.alternative.totalTax) === 0);
});

test('d10) Loss and zero profit: nil tax everywhere', () => {
  for (const p of [rupees(-500000), 0]) {
    const r = compare(two({ profit: p }), R);
    for (const c of r.cards.filter((k) => k.available)) assert.equal(toRupees(c.totalTax), 0, `${c.key} at ${p}`);
  }
});

test('Structure availability: firm/LLP needs two owners; with two owners the proprietorship is shown as one person owning all of it', () => {
  const r1 = compare(one(), R), r2 = compare(two(), R);
  assert.equal(r1.cards.find((c) => c.key === 'firm')!.available, false);
  const p = r2.cards.find((c) => c.key === 'proprietor')!;
  assert.ok(p.available);
  assert.equal(toRupees(p.totalTax), 208000); // same as case a: one person with the whole 20,00,000
  assert.ok(p.notes.some((n) => /exactly one owner/.test(n)));
});

test('Optimisers never do worse than their baseline (firm: no remuneration; company: all dividend)', () => {
  for (const p of [5, 12, 20, 40, 80, 150, 200]) {
    for (const x of [two({ profit: L(p), extractionPct: 60 }), one({ profit: L(p), extractionPct: 60 })]) {
      for (const c of compare(x, R).cards) if (c.available && c.alternative && c.key !== 'proprietor') assert.ok(c.totalTax <= c.alternative.totalTax, `${c.key} ${p}L`);
    }
  }
});

test('Owner tax counts only the extra tax caused by the business (other income is netted off)', () => {
  // Other income 10L alone: nil (rebate). With 20L profit the proprietor has 30L: 3,00,000 + 6L×30% = 4,80,000 + cess 19,200 = 4,99,200.
  const c = card(one({ owners: [{ sharePct: 100, otherIncome: L(10), regime: 'new' }] }), 'proprietor');
  assert.equal(toRupees(c.totalTax), 499200);
});
