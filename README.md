# Biz Matrix - Business Structure Intelligence

Business structure and registration intelligence for India, FY 2026-27, updated from the supplied commercial report.

## Current release

- 19-question assessment, seven entity structures and 62 registration rules.
- Free preview limited to `floor(total items * 35 / 100)` per section. Filters do not expand it.
- Rs. 49 one-time PhonePe payment unlocks the full report edition and full PDF download.
- Server-side order verification, durable SQLite purchases and private access codes for restoration.
- Full report data is served only through an authenticated, paid backend endpoint, never shipped in public JavaScript.
- PDF downloads only. There is no ZIP or folder download.
- Existing legal/support routes and GitHub Pages deployment remain in place.

Checkout is implemented but **not live until the backend is deployed, its private catalog is supplied and PhonePe credentials are configured**. No credentials are included. See [PhonePe Setup](README-PHONEPE.md).

## Local development

Node.js 22.13+ is required for the backend's SQLite support. Node.js 24 LTS is preferred.

```powershell
npm.cmd --prefix saas-backend ci
npm.cmd --prefix saas-backend start
```

Open `http://localhost:3000/`. Without credentials, the free assessment remains usable and checkout is unavailable. The backend serves only explicitly allowed site files, not the entire repository.

Opening `index.html` directly is sufficient for the free preview, but payments require the backend.

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

`CNAME` contains `bizmatrix.in`. Set these GoDaddy A records for `@`, removing conflicting parking records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Set the `www` CNAME to `biznexa.github.io`. Once DNS and GitHub's certificate are ready, enable Enforce HTTPS in repository Pages settings. A disabled checkbox means DNS/certificate setup is not yet complete, not a broken website button.

## Support and policies

About, Contact, Privacy, Terms, Refunds, Digital Delivery, Cookies, Disclaimer, Grievance Redressal, Accessibility and Corporate Information remain available as static directory routes. Payment-provider and delivery descriptions now match PhonePe and on-site PDF delivery. The owner should review the supplied policies before accepting live payments; this code change is not legal validation of their wording.
