/** "Your inputs" summary for the result sidebar and the PDF cover. */
import { RULESET, UNKNOWN } from '../../engine';
import type { Answers } from './flow';
import type { QuestionDef } from './questions';
import { tPair } from '../i18n';

const SHORT: Record<string, string> = {
  business_type: 'Business type',
  state: 'State / UT',
  supply: 'You sell',
  turnover: 'Turnover (this FY)',
  where_sell: 'Where you sell',
  branch_states: 'Branches in',
  situations: 'Special cases',
  premises: 'Premises',
};

export function inputSummary(answers: Answers, visible: QuestionDef[]): [string, string][] {
  const out: [string, string][] = [];
  for (const q of visible) {
    if (!SHORT[q.id]) continue;
    const a = answers[q.id];
    if (a === undefined) continue;
    let v: string;
    if (a === UNKNOWN) v = 'Not sure';
    else if (q.kind === 'cards') v = tPair(`questions.${q.id}.options.${a}`)[0];
    else if (q.kind === 'state') v = RULESET.states.find((s) => s.code === a)?.name ?? String(a);
    else if (q.kind === 'states') v = (a as string[]).map((c) => RULESET.states.find((s) => s.code === c)?.name ?? c).join(', ');
    else if (q.kind === 'flags') v = (a as string[]).length ? (a as string[]).map((id) => tPair(`questions.${q.id}.flags.${id}`)[0]).join('; ') : q.id === 'where_sell' ? 'Only within my State' : 'None';
    else v = a ? 'Yes' : 'No';
    out.push([SHORT[q.id], v]);
  }
  return out;
}
