import { describe, it, expect } from 'vitest';
import { loadRuleSet } from '../scripts/lib/load-rules';
import { lintRuleSet } from '../scripts/lib/lint';
import { RULESET, buildView, forOwner } from '../engine';
import { run } from './helpers';

describe('rule-set lint', () => {
  const { ruleset, schemaErrors } = loadRuleSet();
  it('YAML passes schema and lint', () => {
    expect(schemaErrors).toEqual([]);
    expect(lintRuleSet(ruleset!).errors).toEqual([]);
  });
  it('compiled rule set matches the YAML', () => {
    expect(RULESET.meta.ruleset_version).toBe(ruleset!.meta.ruleset_version);
    expect(RULESET.rules.length).toBe(ruleset!.rules.length);
    expect(RULESET.documents.length).toBe(ruleset!.documents.length);
  });
  it('catches an unknown fact, a missing source and an unlisted conflict', () => {
    const bad = structuredClone(ruleset!);
    bad.rules[0].applies_if = { fact: 'no_such_fact', equals: true };
    bad.rules[1].source_ref = [];
    bad.config[0].id = 'RENAMED-CAP';
    const errs = lintRuleSet(bad).errors.join('\n');
    expect(errs).toMatch(/unknown fact "no_such_fact"/);
    expect(errs).toMatch(/missing source_ref/);
    expect(errs).toMatch(/RENAMED-CAP: status conflict but no open conflict/);
  });
  it('official status needs a fetched URL', () => {
    const bad = structuredClone(ruleset!);
    bad.rules.find((x) => x.id === 'S24-I-INTERSTATE')!.verification_status = 'official';
    expect(lintRuleSet(bad).errors.join('\n')).toMatch(/S24-I-INTERSTATE: status official requires a source with url/);
  });
});

describe('result view (page and PDF content)', () => {
  const view = (over: Record<string, unknown>) => {
    const { facts, a, checklist } = run(over as never);
    return buildView(facts, a, checklist);
  };
  it('mandatory: headline, 30-day deadline, portal steps, Rule 14A option, after-registration notes', () => {
    const v = view({ aggregate_turnover_lakh: 45 });
    expect(v.verdict).toBe('MANDATORY');
    expect(v.applyWithin).toBe('30 days');
    expect(v.deadlineDays).toBe(30);
    expect(v.steps.length).toBe(5);
    expect(v.options.map((o) => o.id)).toEqual(['ROUTE-RULE-14A']);
    expect(v.options[0].conditions.join(' ')).toContain(String(RULESET.config.find((c) => c.id === 'RULE14A-MONTHLY-CAP-LAKH')!.value));
    expect(v.afterNotes.length).toBeGreaterThan(0);
    expect(v.stateLimitLakh).toBe(40);
    expect(v.exceeded).toBe(true);
  });
  it('not required: short report with no deadline, document list or tips', () => {
    const v = view({ aggregate_turnover_lakh: 10, premises_type: 'unknown' });
    expect(v.verdict).toBe('NOT_REQUIRED');
    expect(v.applyWithin).toBeNull();
    expect(v.groups).toEqual([]);
    expect(v.beforeNotes).toEqual([]);
  });
  it('registering: plain one-line documents, no portal-step rows, at most 3 tips', () => {
    const v = view({ aggregate_turnover_lakh: 45, premises_type: 'rented_registered_agreement' });
    const rows = v.groups.flatMap((g) => g.rows);
    expect(v.groups.map((g) => g.category)).not.toContain('step');
    for (const r of rows) {
      expect(r.name).not.toMatch(/REG-01|Premises proof -/);
      expect(r.detail.length, r.id).toBeLessThanOrEqual(140);
    }
    expect(v.beforeNotes.length).toBeLessThanOrEqual(3);
  });
  it('needs review: plain-language points to confirm, no practitioner jargon', () => {
    const v = view({ aggregate_turnover_lakh: 'unknown' });
    expect(v.verdict).toBe('NEEDS_CA_REVIEW');
    expect(v.confirm[0]).toMatch(/^What is your total turnover/);
    for (const c of v.confirm) expect(c).not.toMatch(/\bclient\b/i);
  });
  it('casual trader: apply 5 days before starting', () => {
    expect(view({ casual_occasional_no_fixed_place: true, casual_long_exhibition_over_180: false, aggregate_turnover_lakh: 5 }).applyWithin).toBe('5 days before you start');
  });
  it('rewrites practitioner wording', () => {
    expect(forOwner('Does the client make inter-State supplies?')).toBe('Do you make inter-State supplies?');
  });
});
