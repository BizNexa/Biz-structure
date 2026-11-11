import { useEffect, useMemo, useRef, useState } from 'react';
import { RULESET, STATE_CODES, UNKNOWN, inForce } from '../../engine';
import { computeFlow, estimateTotal, type Answer, type Answers } from '../questionnaire/flow';
import { STEPS, type QuestionDef } from '../questionnaire/questions';
import { t, tPair } from '../i18n';
import { Icon } from './Icon';

const stateRec = (c: string) => RULESET.states.find((s) => s.code === c);
const SORTED = [...STATE_CODES].sort((a, b) => (stateRec(a)?.name ?? a).localeCompare(stateRec(b)?.name ?? b));
const limitTag = (code: string, asOf: string) => {
  const s = stateRec(code);
  const th = s && RULESET.thresholds.find((x) => x.threshold_category === s.threshold_category && inForce(x, asOf));
  return th ? (th.goods_only_lakh === th.services_or_mixed_lakh ? `₹${th.goods_only_lakh}L limit` : `₹${th.goods_only_lakh}L goods · ₹${th.services_or_mixed_lakh}L services`) : '';
};

interface Props {
  answers: Answers;
  asOf: string;
  lawDate: string;
  onAnswers: (a: Answers) => void;
  onComplete: () => void;
}

export function Wizard({ answers, asOf, lawDate, onAnswers, onComplete }: Props) {
  const flow = useMemo(() => computeFlow(answers, asOf), [answers, asOf]);
  const [cursor, setCursor] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const current: QuestionDef | null = (cursor && flow.visible.find((q) => q.id === cursor)) || flow.next;

  useEffect(() => {
    if (!current) onComplete();
  }, [current, onComplete]);
  // After each answer, bring the card back into view if the user had scrolled past its top (phones).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = cardRef.current;
    if (el && el.getBoundingClientRect().top < 70) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current?.id]);
  if (!current) return null;

  const idx = flow.visible.indexOf(current);
  const total = Math.max(estimateTotal(flow), idx + 1, 6); // most paths are 6-7 questions
  const stepIdx = STEPS.indexOf(current.step);

  const answer = (a: Answer) => {
    const next = { ...answers, [current.id]: a };
    const f = computeFlow(next, asOf);
    const i = f.visible.findIndex((q) => q.id === current.id);
    setCursor(f.visible[i + 1]?.id ?? null);
    onAnswers(next);
  };
  const back = () => idx > 0 && setCursor(flow.visible[idx - 1].id);

  return (
    <div className="tool-card" ref={cardRef}>
      <div className="tool-top">
        <span className="tool-name">{t('app.name')}</span>
        <span className="law-chip">{t('app.lawAsOn', { date: lawDate })}</span>
      </div>
      <div className="stepper" aria-hidden="true">
        {STEPS.map((s, i) => (
          <div key={s}>
            <i style={{ width: i < stepIdx ? '100%' : i === stepIdx ? '50%' : '0%' }} />
          </div>
        ))}
      </div>
      <div className="step-labels" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={i === stepIdx ? 'on' : ''}>
            {t(`app.steps.${s}`)}
          </span>
        ))}
      </div>
      <p className="q-count" aria-live="polite">
        {t('app.question', { n: idx + 1, total })}
      </p>
      <Question key={current.id} q={current} initial={answers[current.id]} asOf={asOf} onAnswer={answer} />
      <div className="nav">
        <button type="button" className="btn quiet sm" onClick={back} disabled={idx === 0}>
          ← {t('app.back')}
        </button>
        <span className="spacer" />
        <button type="button" className="notsure" onClick={() => answer(UNKNOWN)}>
          {t('app.dontKnow')}
        </button>
      </div>
    </div>
  );
}

function Question({ q, initial, asOf, onAnswer }: { q: QuestionDef; initial: Answer | undefined; asOf: string; onAnswer: (a: Answer) => void }) {
  const h = useRef<HTMLHeadingElement>(null);
  const [sel, setSel] = useState<string[]>(Array.isArray(initial) ? initial : []);
  const [more, setMore] = useState(Array.isArray(initial) && q.flags?.some((f) => f.more && initial.includes(f.id)));
  const [query, setQuery] = useState('');
  const [moreCards, setMoreCards] = useState(!!q.options?.find((o) => o.id === initial)?.more);
  useEffect(() => h.current?.focus({ preventScroll: true }), []);
  const base = `questions.${q.id}`;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="fade-in">
      <h2 className="q-title" tabIndex={-1} ref={h} id={`q-${q.id}`}>
        {t(`${base}.label`)}
      </h2>
      <p className="q-help">{t(`${base}.help`)}</p>

      {q.kind === 'cards' && (
        <>
        <div className={`options ${q.options!.length > 5 ? 'two' : ''}`} role="radiogroup" aria-labelledby={`q-${q.id}`}>
          {q.options!.filter((o) => !o.more || moreCards).map((o) => {
            const [title, detail] = tPair(`${base}.options.${o.id}`);
            return (
              <label key={o.id} className={`option ${initial === o.id ? 'on' : ''}`}>
                <input type="radio" name={q.id} checked={initial === o.id} onChange={() => onAnswer(o.id)} onClick={() => initial === o.id && onAnswer(o.id)} />
                <span className="ico">
                  <Icon name={o.icon} />
                </span>
                <span>
                  <b>{title}</b>
                  {detail && <small>{detail}</small>}
                </span>
              </label>
            );
          })}
        </div>
        {q.options!.some((o) => o.more) && !moreCards && (
          <button type="button" className="linkbtn more-toggle" onClick={() => setMoreCards(true)}>
            {q.id === 'business_type' ? 'More business types' : 'More options'}
          </button>
        )}
        </>
      )}

      {q.kind === 'yesno' && (
        <div className="yesno" role="radiogroup" aria-labelledby={`q-${q.id}`}>
          {[true, false].map((v) => (
            <label key={String(v)} className={`option ${initial === v ? 'on' : ''}`}>
              <input type="radio" name={q.id} checked={initial === v} onChange={() => onAnswer(v)} onClick={() => initial === v && onAnswer(v)} />
              <span>{v ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      )}

      {(q.kind === 'state' || q.kind === 'states') && (
        <div className="state-pick">
          <label className="sr-only" htmlFor={`s-${q.id}`}>
            {t('app.searchState')}
          </label>
          <input id={`s-${q.id}`} placeholder={`${t('app.searchState')}…`} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          <div className="state-list" role={q.kind === 'state' ? 'radiogroup' : 'group'} aria-labelledby={`q-${q.id}`}>
            {SORTED.filter((c) => (stateRec(c)?.name ?? c).toLowerCase().includes(query.toLowerCase())).map((c) => {
              const on = q.kind === 'state' ? initial === c : sel.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  className={on ? 'on' : ''}
                  aria-pressed={on}
                  onClick={() => (q.kind === 'state' ? onAnswer(c) : toggle(c))}
                >
                  {stateRec(c)?.name}
                  {q.kind === 'state' && <span className="tag">{limitTag(c, asOf)}</span>}
                </button>
              );
            })}
          </div>
          {q.kind === 'states' && (
            <div className="nav" style={{ borderTop: 0, paddingTop: 0 }}>
              <span className="spacer" />
              <button type="button" className="btn sm" disabled={!sel.length} onClick={() => onAnswer(sel)}>
                {t('app.next')} →
              </button>
            </div>
          )}
        </div>
      )}

      {q.kind === 'flags' && (
        <>
          <div className="options" role="group" aria-labelledby={`q-${q.id}`}>
            {q.flags!
              .filter((fl) => !fl.more || more)
              .map((fl) => {
                const [title, detail] = tPair(`${base}.flags.${fl.id}`);
                const on = sel.includes(fl.id);
                return (
                  <label key={fl.id} className={`option check ${fl.exclusive ? 'exclusive' : ''} ${on ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        // The plain "none" answer moves straight on; ticking anything else clears it.
                        if (fl.exclusive) return onAnswer([fl.id]);
                        const ex = new Set(q.flags!.filter((x) => x.exclusive).map((x) => x.id));
                        setSel((cur) => (cur.includes(fl.id) ? cur.filter((x) => x !== fl.id) : [...cur.filter((x) => !ex.has(x)), fl.id]));
                      }}
                    />
                    <span className="ico">
                      <Icon name={fl.icon} />
                    </span>
                    <span>
                      <b>{title}</b>
                      {detail && <small>{detail}</small>}
                    </span>
                  </label>
                );
              })}
          </div>
          {q.flags!.some((f) => f.more) && (
            <button type="button" className="linkbtn more-toggle" onClick={() => setMore(!more)} aria-expanded={more}>
              {more ? t('app.fewerSituations') : t('app.moreSituations')}
            </button>
          )}
          <div className="nav" style={{ borderTop: 0, paddingTop: 4 }}>
            <span className="spacer" />
            <button type="button" className="btn sm" disabled={!sel.length} onClick={() => onAnswer(sel)}>
              {t('app.next')} →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
