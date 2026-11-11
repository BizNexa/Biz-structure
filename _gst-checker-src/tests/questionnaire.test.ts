import { describe, it, expect } from 'vitest';
import { assess, UNKNOWN, FACTS } from '../engine';
import { computeFlow, type Answers } from '../ui/questionnaire/flow';
import { QUESTIONS } from '../ui/questionnaire/questions';
import { en } from '../ui/i18n/en';

const AS_OF = '2026-11-07';

/** Answers every visible question from a script; flags default to "none of these". */
function walk(script: Answers, asOf = AS_OF) {
  const answers: Answers = {};
  for (let i = 0; i < 40; i++) {
    const flow = computeFlow(answers, asOf);
    if (flow.complete) return { flow, answers, a: assess(flow.facts, asOf) };
    const q = flow.next!;
    if (q.id in script) answers[q.id] = script[q.id];
    else if (q.kind === 'flags') answers[q.id] = [];
    else throw new Error(`script has no answer for visible question ${q.id}`);
  }
  throw new Error('flow did not complete');
}

const trader: Answers = { business_type: 'proprietorship', state: 'MH', supply: 'goods', turnover: '20to40', special_goods: false };

describe('short questionnaire', () => {
  it('every question and option has text; every fact exists', () => {
    const Q = en.questions as Record<string, { label: string; help: string; options?: Record<string, unknown>; flags?: Record<string, unknown> }>;
    for (const q of QUESTIONS) {
      expect(Q[q.id]?.label, q.id).toBeTruthy();
      expect(Q[q.id]?.help, q.id).toBeTruthy();
      q.options?.forEach((o) => expect(Q[q.id].options?.[o.id], `${q.id}.${o.id}`).toBeTruthy());
      q.flags?.forEach((fl) => expect(Q[q.id].flags?.[fl.id], `${q.id}.${fl.id}`).toBeTruthy());
      q.touches.forEach((k) => expect(FACTS).toHaveProperty(k));
    }
  });

  it('small local trader below the limit: 7 short questions, NOT_REQUIRED, nothing left open', () => {
    const { flow, a } = walk(trader);
    expect(flow.visible.map((q) => q.id)).toEqual(['business_type', 'state', 'supply', 'turnover', 'special_goods', 'where_sell', 'situations']);
    expect(a.verdict).toBe('NOT_REQUIRED');
    expect(a.open_questions).toEqual([]);
  });

  it('service provider above the limit: 7 questions including premises, MANDATORY', () => {
    const { flow, a } = walk({ business_type: 'llp', state: 'KA', supply: 'services', turnover: '20to40', premises: 'rented_registered_agreement' });
    expect(flow.visible.length).toBeLessThanOrEqual(7);
    expect(flow.visible.map((q) => q.id)).toContain('premises');
    expect(a.verdict).toBe('MANDATORY');
  });

  it('goods-limit question is skipped where the Rs 40 lakh limit does not exist', () => {
    const { flow, a } = walk({ ...trader, state: 'TS', premises: 'owned' });
    expect(flow.visible.map((q) => q.id)).not.toContain('special_goods');
    expect(a.verdict).toBe('MANDATORY');
  });

  it('online goods seller: follow-ups appear only when relevant', () => {
    const base = { business_type: 'proprietorship', state: 'MH', supply: 'goods', turnover: 'upto10', where_sell: ['marketplace'], other_state_reg: false };
    const small = walk({ ...base, eco_small_seller: true });
    expect(small.flow.visible.map((q) => q.id)).toEqual(expect.arrayContaining(['eco_small_seller', 'other_state_reg']));
    expect(small.a.verdict).toBe('NOT_REQUIRED');
    expect(walk({ ...base, eco_small_seller: false, premises: 'owned' }).a.verdict).toBe('MANDATORY');
  });

  it('branch in another State asks which State and applies its limit', () => {
    const { a } = walk({ business_type: 'private_company', state: 'GA', supply: 'services', turnover: '10to20', where_sell: ['branch'], branch_states: ['MN'], premises: 'owned' });
    expect(a.verdict).toBe('MANDATORY');
  });

  it('TDS tick leads to the TDS type question and REG-07', () => {
    const { a } = walk({ business_type: 'public_company', state: 'DL', supply: 'nothing', situations: ['tds'], tds_type: 'psu' });
    expect(a.verdict).toBe('MANDATORY');
    expect(a.recommended_route_ids).toEqual(['ROUTE-REG07-TDS']);
  });

  it('"Not sure" on turnover routes to a professional check', () => {
    const { a } = walk({ business_type: 'proprietorship', state: 'MH', supply: 'services', turnover: UNKNOWN, premises: 'owned' });
    expect(a.verdict).toBe('NEEDS_CA_REVIEW');
  });

  it('exempt-only supplier skips turnover and sales questions', () => {
    const { flow, a } = walk({ business_type: 'proprietorship', state: 'MH', supply: 'exempt_only' });
    expect(flow.visible.map((q) => q.id)).toEqual(['business_type', 'state', 'supply', 'situations']);
    expect(a.verdict).toBe('NOT_REQUIRED');
  });

  it('question 1 offers only the seven business structures', () => {
    expect(QUESTIONS[0].options!.map((o) => o.id)).toEqual(['proprietorship', 'partnership', 'llp', 'private_company', 'opc', 'public_company', 'huf']);
  });

  it('"Only customers in my own State" and "No, none of these" work as plain answers', () => {
    const viaOptions = walk({ ...trader, where_sell: ['local_only'], situations: ['none'] });
    const viaEmpty = walk(trader);
    expect(viaOptions.flow.facts).toEqual(viaEmpty.flow.facts);
    expect(viaOptions.a.verdict).toBe('NOT_REQUIRED');
  });

  it('running a platform is a special case, followed by the operator question', () => {
    const { flow, a } = walk({ ...trader, turnover: '10to20', situations: ['platform'], platform_role: ['collects_tcs'] });
    expect(flow.visible.map((q) => q.id)).toContain('platform_role');
    expect(a.recommended_route_ids).toContain('ROUTE-REG07-TCS');
  });

  it('no question asks for personal identifiers', () => {
    const banned = /(^|_)(pan_number|aadhaar_number|gstin|legal_name|address|email|mobile|phone)(_|$)/i;
    for (const q of QUESTIONS) expect(banned.test(q.id)).toBe(false);
  });
});
