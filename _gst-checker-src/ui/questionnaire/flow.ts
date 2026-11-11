/**
 * Pure questionnaire flow: which questions are visible, and the facts the answers produce.
 * No React here, so it can be unit-tested.
 */
import { UNKNOWN, assess, type Facts, type FactValue, type Assessment } from '../../engine';
import { QUESTIONS, ROUTE_DEFAULTS, type QuestionDef, type FlowCtx } from './questions';

/** cards/state: option id or code; states/flags: ids; yesno: boolean; UNKNOWN = "I don't know". */
export type Answer = string | boolean | string[] | typeof UNKNOWN;
export type Answers = Record<string, Answer>;

export function factsForAnswer(q: QuestionDef, a: Answer | undefined, so_far: Facts): Facts {
  if (a === undefined) return {};
  if (a === UNKNOWN) return Object.fromEntries(q.touches.map((k) => [k, UNKNOWN])) as Facts;
  switch (q.kind) {
    case 'cards':
      return q.options!.find((o) => o.id === a)?.facts ?? {};
    case 'state':
      return { ppob_state: a as FactValue };
    case 'states':
      return { other_supply_states: (a as string[]).filter((s) => s !== so_far.ppob_state) };
    case 'yesno':
      return a === true ? q.yes!(so_far) : q.no!(so_far);
    case 'flags': {
      let out: Facts = { ...(q.none ?? {}) };
      for (const id of a as string[]) out = { ...out, ...(q.flags!.find((fl) => fl.id === id)?.facts ?? {}) };
      return out;
    }
  }
}

export interface FlowState {
  facts: Facts;
  visible: QuestionDef[];
  next: QuestionDef | null;
  complete: boolean;
}

export function computeFlow(answers: Answers, asOf: string): FlowState {
  let facts: Facts = { ...ROUTE_DEFAULTS };
  const visible: QuestionDef[] = [];
  let next: QuestionDef | null = null;
  const ticked = (qid: string, flag: string) => Array.isArray(answers[qid]) && (answers[qid] as string[]).includes(flag);
  for (const q of QUESTIONS) {
    let cached: Assessment | null = null;
    const snapshot = facts;
    const ctx: FlowCtx = { asOf, ticked, provisional: () => (cached ??= assess(snapshot, asOf)) };
    if (next) break; // later visibility cannot be known until the gap is answered
    const show = q.showIf ? q.showIf(facts, ctx) : true;
    if (!show) {
      if (q.hidden) facts = { ...facts, ...q.hidden(facts) };
      continue;
    }
    visible.push(q);
    const a = answers[q.id];
    if (a === undefined) {
      next = q;
      continue;
    }
    facts = { ...facts, ...factsForAnswer(q, a, facts) };
  }
  return { facts, visible, next, complete: next === null };
}

/** Rough count of questions still to come, for the progress bar. */
export function estimateTotal(flow: FlowState): number {
  if (!flow.next) return flow.visible.length;
  const rest = QUESTIONS.slice(QUESTIONS.indexOf(flow.next) + 1).filter((q) => !q.showIf).length;
  return flow.visible.length + rest + 1; // + premises, usually asked
}
