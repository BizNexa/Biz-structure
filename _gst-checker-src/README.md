# GST Registration Checker (Biz Matrix)

A free, single-page tool for Indian businesses, built to sit at **bizmatrix.in/gst-registration-checker/**. It answers *"Do I need GST registration?"* in about 7 questions. The answer comes with:
- the turnover limit for the user's State,
- the registration route and faster options (Rule 14A / 14B),
- the steps on the GST portal and a 30-day deadline calculator,
- a tick-able document checklist,
- what to do after registration,
- a Biz Matrix-style PDF report, plus WhatsApp share and copy.

The page also carries crawlable content (State-wise limit table, who must register, documents, recent changes, FAQ with FAQPage schema). This content is generated from the rule data at build time.

It is general guidance, not legal or tax advice, and it files nothing.

## Run

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run build` writes a static site to `dist/` with relative paths. Upload the folder to `/gst-registration-checker/` on bizmatrix.in.

```bash
npm run qa
```

`npm run qa` runs the rule lint, typecheck and tests, regenerates the review reports, and writes sample PDFs to `docs/samples/`.

## Layout

| Path | What it holds |
|---|---|
| `rules/*.yaml` | All legal content: limits, compulsory cases, exemptions, deadlines, routes, documents, notes. |
| `engine/` | Pure TypeScript. `assess()` gives the verdict, `buildChecklist()` the documents, and `buildView()` the plain-language result shown on the page and in the PDF. |
| `ui/questionnaire/` | The short adaptive question set and its flow logic. |
| `ui/components/` | Wizard (hero card) and Result (full-width section). |
| `ui/report/pdf.ts` | PDF report in the Biz Matrix style (Inter fonts, gold bar, seal, sections). |
| `scripts/seo-content.ts` | Generates the static State table, compulsory list and FAQ (with JSON-LD) from the rules. |
| `public/` | Biz Matrix logo, icons and Inter fonts, copied from the main site. |
| `docs/` | Source index, conflicts register, review pack, reports, sample PDFs. |

## Keeping the law current

The tool applies the rules in force on the day it is used. The "Law updated as on" date shown on the page and in the PDF is `ruleset_date` in `rules/meta.yaml`.

When the law changes:
1. Edit or add the record in `rules/*.yaml`. For a change that takes effect on a date, end the old record (`effective_to`) and add a new one.
2. Update `ruleset_date` and bump `ruleset_version`.
3. Run `npm run qa`, then `npm run build`, then deploy.

## SEO notes

- **Title:** "GST Registration Checker – Is GST Registration Required for You? | Biz Matrix".
- **Primary keywords:** *GST registration checker*, *is GST registration required*, *GST registration limit*, *documents required for GST registration*.
- **Structured data:** WebApplication, BreadcrumbList and FAQPage schema are included.
- **To add on the main site:**
  - a sitemap entry for `https://www.bizmatrix.in/gst-registration-checker/`;
  - a link from the home page and footer;
  - Search Console submission after deployment.

## Publishing inside bizmatrix.in

This folder lives inside the website folder as `_gst-checker-src/`. GitHub Pages does not publish folders starting with `_`, and `_config.yml` also excludes it.

To publish a new build, run this inside `_gst-checker-src/`:

```bash
npm run build:site
```

It rebuilds `../gst-registration-checker/`, the page served at www.bizmatrix.in/gst-registration-checker/.
