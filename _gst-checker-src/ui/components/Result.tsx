import { useMemo, useState } from 'react';
import type { ResultView } from '../../engine';
import { t, tList } from '../i18n';
import { Icon } from './Icon';

interface Props {
  view: ResultView;
  inputs: [string, string][];
  turnoverLabel: string | null;
  lawDate: string;
  onRestart: () => void;
}

const TICKS_KEY = 'bizmatrix.gstcheck.ticks';
const loadTicks = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(TICKS_KEY) || '{}');
  } catch {
    return {};
  }
};

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};
const todayIso = () => new Date().toISOString().slice(0, 10);

export function Result({ view: v, inputs, turnoverLabel, lawDate, onRestart }: Props) {
  const [ticks, setTicks] = useState<Record<string, boolean>>(loadTicks);
  const [crossed, setCrossed] = useState(todayIso());
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const verdict = { title: t(`verdict.${v.verdict}.title`), seal: t(`verdict.${v.verdict}.seal`) };
  const allRows = v.groups.flatMap((g) => g.rows);
  const done = allRows.filter((r) => ticks[r.id]).length;
  const registering = v.verdict === 'MANDATORY' || v.verdict === 'NEEDS_CA_REVIEW';

  const toggle = (id: string) => {
    const n = { ...ticks, [id]: !ticks[id] };
    setTicks(n);
    try {
      localStorage.setItem(TICKS_KEY, JSON.stringify(n));
    } catch {
      /* storage unavailable */
    }
  };

  const summaryText = useMemo(
    () =>
      [
        `GST Registration Checker (Biz Matrix): ${verdict.title}.`,
        v.headline,
        v.applyWithin ? `Apply within: ${v.applyWithin}.` : '',
        `Check yours: https://www.bizmatrix.in/gst-registration-checker/`,
      ]
        .filter(Boolean)
        .join(' '),
    [v, verdict.title],
  );

  const pdf = async () => {
    setBusy(true);
    try {
      const { downloadReport } = await import('../report/pdf');
      await downloadReport(v, inputs, turnoverLabel);
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const limit = v.stateLimitLakh;

  return (
    <div className="wrap res-grid fade-in">
      <div className="res-main">
        {/* Verdict */}
        <section className={`card verdict v-${v.verdict}`} aria-labelledby="verdict-title">
          <div>
            <p className="eyebrow">{t('result.eyebrow')}</p>
            <h2 id="verdict-title">{verdict.title}</h2>
            <p>{v.headline}</p>
          </div>
          <div className="seal" aria-hidden="true">
            <div>
              <b>{verdict.seal}</b>
              <small>GST · {lawDate.split(' ').slice(-1)}</small>
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section className="card" aria-labelledby="glance-title">
          <h2 id="glance-title">{t('result.keyFacts')}</h2>
          <div className="glance">
            <div className="tile">
              <small>{t('result.stateLimit')}</small>
              <b>{limit ? `₹${limit} lakh` : '—'}</b>
            </div>
            <div className="tile">
              <small>{t('result.yourTurnover')}</small>
              <b>{turnoverLabel ?? '—'}</b>
            </div>
            <div className="tile">
              <small>{t('result.applyWithin')}</small>
              <b>{v.applyWithin ?? 'Not needed now'}</b>
            </div>
            <div className="tile">
              <small>{t('result.approval')}</small>
              <b>{v.approval ?? '—'}</b>
            </div>
          </div>
        </section>

        {v.confirm.length > 0 && (
          <section className="confirm" aria-labelledby="confirm-title">
            <h2 id="confirm-title">{t('result.confirm')}</h2>
            <p>{t('result.confirmIntro')}</p>
            <ol>
              {v.confirm.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </section>
        )}

        {!(v.reasons.length === 1 && v.reasons[0] === v.headline) && (
        <section className="card" aria-labelledby="why-title">
          <h2 id="why-title">{t('result.reasons')}</h2>
          <ul className="bullets">
            {v.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
        )}

        {registering && (v.routes.length > 0 || v.steps.length > 0) && (
          <section className="card" aria-labelledby="route-title">
            <h2 id="route-title">{t('result.route')}</h2>
            {v.routes.map((r) => (
              <div className="route" key={r.id}>
                <b>{r.name}</b>
                <span className="form">{r.form}</span>
                <p>{r.text}</p>
              </div>
            ))}
            {v.options.length > 0 && (
              <>
                <h3>{t('result.fasterOptions')}</h3>
                {v.options.map((o) => (
                  <div className="option-card" key={o.id}>
                    <span className="tag">Optional</span>
                    <p>
                      <b>{o.name}</b>
                    </p>
                    <ul>
                      {o.conditions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
            {v.steps.length > 0 && (
              <>
                <h3>{t('result.howToApply')}</h3>
                <ol className="timeline">
                  {v.steps.map((s) => (
                    <li key={s.title}>
                      <b>{s.title}</b>
                      <span>{s.detail}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {v.deadlineDays && (
              <>
                <h3>{t('result.deadlineTitle')}</h3>
                <div className="deadline">
                  <label>
                    {t('result.deadlineLabel')}
                    <input type="date" value={crossed} onChange={(e) => e.target.value && setCrossed(e.target.value)} />
                  </label>
                  <p className="due">{t('result.deadlineResult', { date: addDays(crossed, v.deadlineDays) })}</p>
                </div>
                <p className="fine">{t('result.deadlineNote')}</p>
              </>
            )}
          </section>
        )}

        {!registering && (
          <section className="card" aria-labelledby="vol-title">
            <h2 id="vol-title">{t('result.voluntaryTitle')}</h2>
            <div className="pros">
              <div>
                <h3>Benefits</h3>
                <ul>
                  {tList('result.voluntaryPros').map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Obligations</h3>
                <ul>
                  {tList('result.voluntaryCons').map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {allRows.length > 0 && (
          <section className="card" aria-labelledby="docs-title">
            <h2 id="docs-title">{v.checklistIsVoluntary ? t('result.checklistVoluntary') : t('result.checklist')}</h2>
            <div className="progress-ring">
              <svg className="ring" viewBox="0 0 54 54" aria-hidden="true">
                <circle className="bg" cx="27" cy="27" r="22" />
                <circle className="fg" cx="27" cy="27" r="22" strokeDasharray={138.2} strokeDashoffset={138.2 * (1 - done / allRows.length)} />
              </svg>
              <b>{t('result.ready', { done, total: allRows.length })}</b>
            </div>
            {v.groups.map((g) => (
              <div className="doc-group" key={g.category}>
                <h3>{t(`categories.${g.category}`)}</h3>
                <ul className="docs">
                  {g.rows.map((r) => (
                    <li key={r.id} className={ticks[r.id] ? 'done' : ''}>
                      <label>
                        <input type="checkbox" checked={!!ticks[r.id]} onChange={() => toggle(r.id)} />
                        <span>
                          <b>{r.name}</b>
                          <p>{r.detail}</p>
                          {r.template && (
                            <p className="tpl">
                              {t('result.template')}: {r.template.name.replace(/ \(Circular.*\)$/, '')}. {t('result.templateNote')}
                            </p>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {v.beforeNotes.length > 0 && (
              <>
                <h3>Before you apply</h3>
                <ul className="bullets">
                  {v.beforeNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {v.afterNotes.length > 0 && (
          <section className="card" aria-labelledby="after-title">
            <h2 id="after-title">{t('result.afterReg')}</h2>
            <ul className="bullets">
              {v.afterNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" aria-labelledby="next-title">
          <h2 id="next-title">{t('result.nextSteps')}</h2>
          <ol className="steps-n">
            {v.nextSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <p className="disclaimer-sm">{t('result.disclaimer', { date: lawDate })}</p>
      </div>

      <aside className="res-side" aria-label="Report and summary">
        <div className="card action-card">
          <ul className="side-summary">
            {inputs.map(([k, val]) => (
              <li key={k}>
                <span>{k}</span>
                <b>{val}</b>
              </li>
            ))}
          </ul>
          <button className="btn gold" onClick={pdf} disabled={busy}>
            <Icon name="download" /> {busy ? t('app.preparing') : t('app.downloadPdf')}
          </button>
          <div className="row">
            <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(summaryText)}`} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} /> WhatsApp
            </a>
            <button className="btn ghost" onClick={copy}>
              <Icon name="copy" size={18} /> {copied ? t('app.copied') : 'Copy'}
            </button>
          </div>
          <button className="btn quiet" style={{ marginTop: 8 }} onClick={onRestart}>
            <Icon name="restart" size={18} /> {t('app.startAgain')}
          </button>
        </div>
        <div className="card cross">
          <b>{t('result.crossSell')}</b>
          <p>{t('result.crossSellText')}</p>
          <a className="btn ghost sm" href="../business-structure/">
            {t('result.crossSellCta')} →
          </a>
        </div>
      </aside>
    </div>
  );
}
