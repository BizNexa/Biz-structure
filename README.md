# Biz Matrix - Business Structure Intelligence

Business structure and registration intelligence for India, FY 2026-27, updated from the supplied commercial report.

## Current release

- 26-question assessment (16 structure + 10 registration), seven entity structures, BizMatrix Rulebook v1.0 engine (23 hard rules, 9 weighted factors, 25 regression tests) and 62 registration rules.
- Free preview limited to `floor(total items * 35 / 100)` per section. Filters do not expand it.
- Rs. 49 one-time Cashfree payment unlocks the full report edition and full PDF download.
- Server-side order verification, durable SQLite purchases and private access codes for restoration.
- Full report data is served only through an authenticated, paid backend endpoint, never shipped in public JavaScript.
- PDF downloads only. There is no ZIP or folder download.
- The public homepage is a branded landing site. The assessment app is available at `/assessment/`.
- Existing legal/support routes and GitHub Pages deployment remain in place.

Checkout is implemented but **not live until the backend is deployed, its private catalog is supplied and Cashfree credentials are configured on that server**. No credentials are included in the website. See [Cashfree Setup](README-CASHFREE.md).

## Local development

Node.js 22.13+ is required for the backend's SQLite support. Node.js 24 LTS is preferred.

```powershell
npm.cmd --prefix saas-backend ci
npm.cmd --prefix saas-backend start
```

Open `http://localhost:3000/assessment/`. Without credentials, the free assessment remains usable and checkout is unavailable. The backend serves only explicitly allowed site files, not the entire repository.

Opening `assessment/index.html` directly is sufficient for the free preview, but payments require the backend.

## Importing an updated report

Keep the complete commercial source outside this public repository. Install development-only parsers outside the publishing directory:

```powershell
npm.cmd install --no-save --prefix "$env:TEMP\bizmatrix-tools" acorn@8.19.0 parse5@8.0.1 linkedom@0.18.13
node tools/import-commercial.cjs 'C:\private\commercial.html'
node tools/prepare-premium.cjs 'C:\private\commercial.html'
node tools/verify-preview.cjs
node tools/verify-payment-frontend.cjs
npm.cmd --prefix saas-backend test
```

The importer strips locked descriptions from public assets. The second command prepares `saas-backend/private/catalog.json`, which is gitignored. Never commit that catalog, the complete source, `.env`, purchase databases or the recovery-code signing key.

## GitHub Pages

The existing deployment publishes `main` from the repository root through GitHub Pages/Jekyll. `_config.yml` excludes backend code, private data, tools and the reference deployment folder. Do not publish a second stale Pages artifact.

GitHub Pages cannot execute the payment backend. To retain Pages for the frontend, deploy the backend separately over HTTPS and set `window.BIZ_API_BASE_URL` in `js/config.js` to its origin. The backend can alternatively serve the whole site.

### Custom domain

`CNAME` contains `www.bizmatrix.in` so the GitHub Pages certificate matches the `www` URL. Set these GoDaddy A records for `@`, removing conflicting parking records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Set the `www` CNAME to `biznexa.github.io`. Once DNS and GitHub's certificate are ready, enable Enforce HTTPS in repository Pages settings. A disabled checkbox means DNS/certificate setup is not yet complete, not a broken website button. GitHub may take some time to issue or refresh the certificate after the custom domain changes.

## Support and policies

About, Contact, Privacy, Terms, Refunds, Digital Delivery, Cookies, Disclaimer, Grievance Redressal, Accessibility and Corporate Information remain available as static directory routes. Payment-provider and delivery descriptions now match Cashfree and on-site PDF delivery. The owner should review the supplied policies before accepting live payments; this code change is not legal validation of their wording.

## Knowledge base (checklists, registrations, compliances)

Rebuild the parsed tables with `tools/parse-sources.cjs` (see its header), then run `tools/build-kb.cjs`. The document checklist, registration planner, compliance calendar, action plan and PDF report are generated from four reference sources kept **outside** this repository: the Master Registration Checklist v1.0 (JSON), the Registration Master Map FY 2026-27, and the Initial & Annual Compliance Master (law as of 6 Nov 2026).

```powershell
node tools/build-kb.cjs --checklist <bizmatrix_master_checklist.json> --regmap <regmap.json> --compliance <compliance.json> --base <current private catalog.json>
```

This writes two files:

- `js/kb-public.js`: public skeleton (names, applicability rules and full detail for the core 35% of each list). Commit it.
- `saas-backend/private/catalog.json`: the full catalog for paid users. It is gitignored and must never be committed.

Upload the full catalog to the payment Worker so paid users receive it:

```powershell
$env:WORKER_URL="https://biz-structure.nexifydigital03.workers.dev"; $env:SETUP_TOKEN="<your setup token>"; node worker/upload-catalog.mjs
```

Until the new catalog is uploaded, paid users still unlock their report but see detail only for the public 35% core.

The PDF report uses Inter (SIL Open Font License, `assets/fonts/OFL.txt`).

## Site structure (multi-product, from 10 Nov 2026)

| URL | What it is | Source |
|---|---|---|
| `/` | Biz Matrix home: lists all tools (`index.html`, `css/hub.css`) | this folder |
| `/business-structure/` | Business Structure Matrix landing page (the former home page) | this folder |
| `/assessment/` | Business Structure assessment app (unchanged) | this folder |
| `/gst-registration-checker/` | GST Registration Checker | **built output**; source is `_gst-checker-src/` in this folder (never published) |

- **Updating the GST checker:** do not edit `gst-registration-checker/` by hand. Change the source in `_gst-checker-src/`, then run `npm run build:site` inside `_gst-checker-src/`, which rebuilds `gst-registration-checker/`. Then run `node tools/bust-cache.cjs` here as usual. The `_` prefix keeps the source off the live site.
- **Adding a new tool:**
  1. Put it in its own folder.
  2. Add a card to the tool grid in `index.html` (plus its ItemList entry in the JSON-LD).
  3. Add it to the "Tools" footer column on the pages and to `sitemap.xml`.
  4. If the Node backend serves the site, add the folder to the page list in `saas-backend/app.js`.
- **Backup:** a copy of this folder from before the change is in `..\Biz-structure-main-backup-2026-11-10` (the `ad` folder was not copied).
