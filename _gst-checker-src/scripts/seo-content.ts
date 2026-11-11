/**
 * Static, crawlable page content generated from the compiled rule set at build time (Vite plugin in
 * vite.config.ts). Keeps the law in data: limits, compulsory cases and documents come from rules/*.yaml.
 */
import type { CompiledRuleSet } from '../engine/ruleset';
import { inForce } from '../engine/ruleset';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rs$ = (n: number) => `₹${n} lakh`;

export function lawDate(rs: CompiledRuleSet): string {
  const [y, m, d] = rs.meta.ruleset_date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** State-wise limit table. */
export function limitsTable(rs: CompiledRuleSet): string {
  const asOf = rs.meta.ruleset_date;
  const rows = [...rs.states]
    .filter((s) => inForce(s, asOf))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => {
      const t = rs.thresholds.find((x) => x.threshold_category === s.threshold_category && inForce(x, asOf))!;
      const special = t.services_or_mixed_lakh === 10;
      return `<tr${special ? ' class="hl"' : ''}><td>${esc(s.name)}</td><td>${rs$(t.goods_only_lakh)}</td><td>${rs$(t.services_or_mixed_lakh)}</td></tr>`;
    })
    .join('');
  return `<div class="tbl"><table><thead><tr><th scope="col">State / UT</th><th scope="col">Only goods</th><th scope="col">Services or both</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Cases where registration is needed whatever the turnover (s.22(3)/(4) and s.24). */
export function compulsoryList(rs: CompiledRuleSet): string {
  const asOf = rs.meta.ruleset_date;
  const ids = ['S24-I-INTERSTATE', 'S24-IX-ECO-SUPPLIER', 'S24-II-CASUAL', 'S24-III-RCM', 'S24-VII-AGENT', 'S24-VIII-ISD', 'S24-X-TCS', 'S24-IV-ECO-9-5', 'S24-VI-TDS', 'S24-V-NRTP', 'S24-XI-OIDAR', 'S22-3-TRANSFER'];
  return `<ul class="ticks">${ids
    .map((id) => rs.rules.find((r) => r.id === id && inForce(r, asOf)))
    .filter(Boolean)
    .map((r) => `<li>${esc(r!.plain_language)}</li>`)
    .join('')}</ul>`;
}

/** Plain summary of the limits, built from the threshold data. */
export function limitSummary(rs: CompiledRuleSet): string {
  const asOf = rs.meta.ruleset_date;
  const by = (pred: (g: number, s: number) => boolean) =>
    rs.states
      .filter((s) => inForce(s, asOf))
      .filter((s) => {
        const t = rs.thresholds.find((x) => x.threshold_category === s.threshold_category && inForce(x, asOf))!;
        return pred(t.goods_only_lakh, t.services_or_mixed_lakh);
      })
      .map((s) => s.name)
      .sort();
  const join = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);
  const ten = by((_g, s) => s === 10);
  const noForty = by((g, s) => g === 20 && s === 20);
  return `You must register once your aggregate turnover in a financial year crosses ₹40 lakh if you sell only goods (in most States), or ₹20 lakh if you supply services or both. The limit is ₹10 lakh in ${join(ten)}. The ₹40 lakh goods limit does not apply in ${join(noForty)}, where it is ₹20 lakh.`;
}

export interface Faq {
  q: string;
  a: string;
}

export function faqs(rs: CompiledRuleSet): Faq[] {
  const asOf = rs.meta.ruleset_date;
  const cap = rs.config.find((c) => c.id === 'RULE14A-MONTHLY-CAP-LAKH')?.value;
  const has = (id: string) => rs.routes.some((r) => r.id === id && inForce(r, asOf)) || rs.timelines.some((t) => t.id === id && inForce(t, asOf));
  const list: Faq[] = [
    {
      q: 'What is the turnover limit for GST registration in India?',
      a: limitSummary(rs),
    },
    {
      q: 'Who must register for GST even below the limit?',
      a: 'Anyone making inter-State taxable sales or exports, sellers on e-commerce marketplaces that collect TCS (with small-seller exemptions), casual traders at events in other States, persons paying GST under reverse charge, agents selling for others in their own name, input service distributors, TDS deductors and TCS-collecting platforms, non-resident suppliers and foreign suppliers of digital services to Indian consumers.',
    },
    {
      q: 'Do I need GST registration to sell on Amazon or Flipkart?',
      a: 'Generally yes. But small sellers of goods who sell only within one State, stay within the turnover limit this year and last year, and obtain a GST enrolment number are exempt; small service providers within ₹20 lakh are also exempt.',
    },
    {
      q: 'Is GST registration required for exporters?',
      a: 'Exports are inter-State supplies, so exporters of goods must register regardless of turnover. Small exporters of services within ₹20 lakh should confirm their position with a professional.',
    },
    {
      q: 'What counts in aggregate turnover?',
      a: 'All taxable, exempt and nil-rated sales, exports and inter-State supplies to your own branches, across India under one PAN. It excludes the GST itself and purchases on which you pay reverse charge. Sale of shares and other non-supplies is not counted.',
    },
    {
      q: 'How long does GST registration take?',
      a: `${has('TL-RULE9A-3WD') ? 'Low-risk applications are approved electronically within 3 working days. ' : ''}Other complete applications are processed within 7 working days. If Aadhaar authentication is not done or the application is flagged, the premises are physically verified and approval can take up to 30 days.`,
    },
    {
      q: 'What is the deadline to apply after crossing the limit?',
      a: 'Apply within 30 days of becoming liable. If you do, registration counts from the date you became liable. Casual and non-resident taxable persons must apply at least 5 days before they start.',
    },
    {
      q: 'Which documents are needed for GST registration?',
      a: 'PAN, proof of constitution (partnership deed, registration certificate, incorporation details), photographs and appointment proof of the authorised signatory, proof of the place of business based on ownership (owned, rented, consent or shared), and bank account proof. Aadhaar authentication of the signatory and a promoter speeds up approval.',
    },
  ];
  if (has('ROUTE-RULE-14A'))
    list.push({
      q: 'What is the simplified GST registration under Rule 14A?',
      a: `An optional route from 1 November 2025 for applicants whose monthly GST on sales to registered businesses stays within ₹${cap} lakh. With Aadhaar authentication, low-risk applications are approved within 3 working days. Only one such registration is allowed per PAN in a State.`,
    });
  list.push({
    q: 'Can I register for GST voluntarily?',
    a: 'Yes. Any business can register voluntarily even below the limit, for example to claim input tax credit or to sell to GST-registered buyers. You then have to file returns and charge GST like any registered person.',
  });
  return list;
}

export function faqHtml(list: Faq[]): string {
  return list.map((f, i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
}

export function faqJsonLd(list: Faq[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
}

/** Replaces <!--SEO:xxx--> markers in index.html. */
export function injectSeo(html: string, rs: CompiledRuleSet): string {
  const list = faqs(rs);
  return html
    .replace(/<!--SEO:LAWDATE-->/g, lawDate(rs))
    .replace(/<!--SEO:CAP14A-->/g, String(rs.config.find((c) => c.id === 'RULE14A-MONTHLY-CAP-LAKH')?.value ?? ''))
    .replace('<!--SEO:COMPULSORY-->', compulsoryList(rs))
    .replace('<!--SEO:FAQ-->', faqHtml(list))
    .replace('<!--SEO:FAQ_JSONLD-->', `<script type="application/ld+json">${faqJsonLd(list)}</script>`);
}
