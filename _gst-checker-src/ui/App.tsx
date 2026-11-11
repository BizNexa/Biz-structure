import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { RULESET, assess, buildChecklist, buildView, lawDateLabel, todayISO } from '../engine';
import { computeFlow, type Answers } from './questionnaire/flow';
import { inputSummary } from './questionnaire/summary';
import { Wizard } from './components/Wizard';
import { Result } from './components/Result';
import { t, tPair } from './i18n';

/** Law applied: the rules in force today (the rule set is kept current; see README). */
const AS_OF = todayISO();
const LAW_DATE = lawDateLabel(RULESET.meta.ruleset_date);

/** Answers survive an accidental refresh within the same tab (sessionStorage only). */
const SESSION_KEY = 'bizmatrix.gstcheck.answers';
function restore(): Answers {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
  } catch {
    return {};
  }
}

export function App({ resultHost }: { resultHost: HTMLElement }) {
  const [answers, setAnswers] = useState<Answers>(restore);
  const [done, setDone] = useState(() => computeFlow(restore(), AS_OF).complete && Object.keys(restore()).length > 0);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(answers));
    } catch {
      /* storage unavailable */
    }
  }, [answers]);
  const flow = useMemo(() => computeFlow(answers, AS_OF), [answers]);

  const result = useMemo(() => {
    if (!done || !flow.complete) return null;
    const a = assess(flow.facts, AS_OF);
    const view = buildView(flow.facts, a, buildChecklist(flow.facts, a));
    const band = answers.turnover;
    const turnoverLabel = typeof band === 'string' && band !== 'unknown' ? tPair(`questions.turnover.options.${band}`)[0] : band === 'unknown' ? 'Not sure' : null;
    return { view, inputs: inputSummary(answers, flow.visible), turnoverLabel };
  }, [done, flow, answers]);

  useEffect(() => {
    resultHost.hidden = !result;
    if (result) setTimeout(() => resultHost.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [result, resultHost]);

  const complete = useCallback(() => setDone(true), []);
  const restart = () => {
    setAnswers({});
    setDone(false);
    document.getElementById('checker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {result ? (
        <div className="tool-card done-card fade-in">
          <div className="seal-sm">{t(`verdict.${result.view.verdict}.seal`)}</div>
          <h2 className="q-title">{t(`verdict.${result.view.verdict}.title`)}</h2>
          <p className="q-help">Your full result, document checklist and PDF report are just below.</p>
          <button className="btn" onClick={() => resultHost.scrollIntoView({ behavior: 'smooth' })}>
            See my result ↓
          </button>
          <button className="linkbtn" onClick={restart}>
            {t('app.startAgain')}
          </button>
        </div>
      ) : (
        <Wizard
          answers={answers}
          asOf={AS_OF}
          lawDate={LAW_DATE}
          onAnswers={(a) => {
            setAnswers(a);
            setDone(false);
          }}
          onComplete={complete}
        />
      )}
      {result && createPortal(<Result view={result.view} inputs={result.inputs} turnoverLabel={result.turnoverLabel} lawDate={LAW_DATE} onRestart={restart} />, resultHost)}
    </>
  );
}
