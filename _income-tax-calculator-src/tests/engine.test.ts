// Runs every hand-worked case in cases.ts against the engine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rupees, toRupees, computeIndividual, computeFirm, computeCompany, computeSection8 } from '../src/engine/index.ts';
import { cases } from './cases.ts';
import { loadRules } from './helpers.ts';

const R = loadRules();

test('there are at least 80 hand-worked cases with unique IDs', () => {
  assert.ok(cases.length >= 80, `only ${cases.length} cases`);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
});

for (const c of cases) {
  test(`${c.id}  ${c.title}`, () => {
    const actual = c.actual(R);
    assert.equal(toRupees(actual), toRupees(rupees(c.expected)), `${c.id}: ${c.working}`);
  });
}

test('non-residents are reported as not supported for every entity', () => {
  assert.equal(computeIndividual({ kind: 'individual', resident: false }, R).status, 'not_supported');
  assert.equal(computeIndividual({ kind: 'huf', resident: false }, R).status, 'not_supported');
  assert.equal(computeFirm({ resident: false, normalIncome: 0 }, R).status, 'not_supported');
  assert.equal(computeCompany({ resident: false, companyType: 'private', regime: 'normal', normalIncome: 0 }, R).status, 'not_supported');
  assert.equal(computeSection8({ registeredNpo: true, resident: false, npo: { regularIncome: 0, appliedForObjects: 0 } }, R).status, 'not_supported');
});

test('negative and fractional amounts are rejected with a clear message', () => {
  assert.throws(() => computeIndividual({ kind: 'individual', resident: true, businessIncome: -100 }, R), /negative amounts are not accepted/);
  assert.throws(() => computeFirm({ resident: true, normalIncome: 10.5 }, R), /whole number of paise/);
});

test('private company carries the closely-held notes; public company does not', () => {
  const base = { resident: true, regime: 'normal' as const, normalIncome: rupees(1000000), bookProfit: 0, turnoverTaxYear2024_25: rupees(1000000) };
  const priv = computeCompany({ ...base, companyType: 'private' }, R);
  const pub = computeCompany({ ...base, companyType: 'public' }, R);
  assert.ok(priv.status === 'ok' && pub.status === 'ok');
  assert.ok(priv.notes.some((n) => /deemed dividend/.test(n)));
  assert.ok(priv.notes.some((n) => /51%/.test(n)));
  assert.ok(!pub.notes.some((n) => /^Closely held/.test(n)));
  assert.equal(priv.taxPayable, pub.taxPayable);
});

test('unsupported scenarios raise warnings instead of computing silently', () => {
  const r = computeIndividual({ kind: 'individual', resident: true, age: 40, businessIncome: rupees(1000000),
    flags: { carriedForwardLosses: true, foreignTaxCredit: true, agriculturalIncome: true, landBuildingAcquiredBefore23Jul2024: true } }, R);
  assert.ok(r.status === 'ok');
  assert.equal(r.results.new.warnings.length, 4);
  const co = computeCompany({ resident: true, companyType: 'private', regime: 'normal', normalIncome: rupees(1000000) }, R);
  assert.ok(co.status === 'ok' && co.warnings.some((w) => /MAT comparison was not made/.test(w)));
});

test('every trace line that carries an amount for a statutory step cites a rule', () => {
  const r = computeIndividual({ kind: 'individual', resident: true, age: 40, salary: { gross: rupees(6000000) }, gains: { ltcgListedEquity198: rupees(500000) } }, R);
  assert.ok(r.status === 'ok');
  for (const regime of ['new', 'old'] as const) {
    const lines = r.results[regime].trace;
    assert.ok(lines.length >= 8);
    for (const label of ['Less: standard deduction', 'Total income (rounded to nearest Rs. 10)', 'Tax payable (rounded to nearest Rs. 10)']) {
      const line = lines.find((l) => l.label === label);
      assert.ok(line && /\[[A-Z]-\d+\]/.test(line.ref), `${regime}: "${label}" should cite a rule`);
    }
    assert.ok(lines.some((l) => /Surcharge/.test(l.label) && /\[A-6[01]\]/.test(l.ref)));
    assert.ok(lines.some((l) => /Cess/.test(l.label) && /\[E-01\]/.test(l.ref)));
  }
});
