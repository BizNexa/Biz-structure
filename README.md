# Biz Matrix – Business Structure Intelligence

Biz Matrix is a static decision-support website that helps Indian founders compare common business structures, understand a limited set of registration and compliance considerations, and request a full report by email.

## Current release

- Static HTML, CSS, and vanilla JavaScript; no frontend framework or package install is required.
- Updated 19-question business assessment and entity recommendation from the supplied FY 2026-27 commercial HTML.
- Seven dashboard sections with a centralized 35% free preview and contact-to-unlock placeholders.
- Registration applicability across the source's 62 registration rules, with limited public details.
- Preview-only browser print and downloadable PDF generation.
- Responsive four-column footer with email-only contact.
- Static route directories for About, Contact, and the ten requested legal/support routes.
- GitHub Pages publishes the repository root using its existing GitHub Pages/Jekyll deployment.

Premium content is not delivered in this static release. The visible gate is not server-side authorization and must not be represented as secure paid-content protection.

The preview limit is `floor(total items * 35 / 100)` for each report section. Whole items are rounded down so the preview never exceeds 35%. Filters operate on the same preview selection; switching categories or searching does not reveal more items. Compliance preview entries are distributed across the available lifecycle categories. The registration preview also uses a fixed limited catalogue so filters cannot progressively expose the complete dataset. Assessment questions, the user's own answers, and the recommended entity remain available.

**Payment integration is intentionally disabled in the current release. Premium access is contact-based.** Unlock requests use `mailto:nexifydigital03@gmail.com`. The separate `saas-frontend/` and `saas-backend/` folders contain future payment-integration code and are excluded from the GitHub Pages artifact.

## Run locally

No package installation is necessary. From the project root, serve the site using any local static-file server, for example:

```sh
npx serve .
```

Then open the URL printed by the server. A local server is required to verify clean directory routes.

## Build and preview

There is no compile/build step. The production-ready static files are in the repository root; `github-pages-deployment/` is retained as a reference copy.

The current production files are `index.html`, `css/app.css`, `css/preview.css`, `js/app.js`, `js/preview.js`, and `js/pdf.min.js`. The PDF libraries from the supplied file are bundled locally with their license notices. The unrelated payment frontend is not loaded.

To import a replacement commercial HTML file and verify the preview, install the development-only parsers and DOM checker outside the publishing directory:

```powershell
npm.cmd install --no-save --prefix "$env:TEMP\bizmatrix-tools" acorn@8.19.0 parse5@8.0.1 linkedom@0.18.13
node tools/import-commercial.cjs 'C:\path\to\commercial.html'
node tools/verify-preview.cjs
```

The import strips locked document, compliance and registration descriptions before writing public assets. `tools/` is excluded from GitHub Pages. Keep the complete commercial source outside this public repository.

```sh
npx serve .
```

The existing GitHub Pages/Jekyll deployment publishes the repository root. `_config.yml` excludes `saas-backend/`, `saas-frontend/`, the reference artifact, and non-site project files.

## GitHub Pages deployment

The repository is already configured to publish the `main` branch through its GitHub Pages/Jekyll deployment. Keep this existing publishing method; adding a second Pages artifact deployment would race with it and can republish stale root content.

The website and legal links use relative paths, so they support both user-site and repository-site Pages URLs without a Vite base-path setting. Legal paths are static directory indexes and can be opened directly, for example `/Biz-structure/privacy-policy/`.

### Custom domain: `bizmatrix.in`

The repository root `CNAME` file sets `bizmatrix.in` as the GitHub Pages custom domain. In **Repository Settings → Pages**, confirm the custom domain is `bizmatrix.in` and enable **Enforce HTTPS** after GitHub finishes provisioning the certificate.

At the domain registrar, configure the apex (`@`) with all four GitHub Pages A records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Optionally point `www` to `BizNexa.github.io` with a CNAME record. Remove conflicting/default records for these hostnames. DNS propagation and certificate provisioning can take up to 24 hours. The current domain did not resolve in the DNS check when this release was prepared, so DNS still needs to be configured and verified.

## Routes

- `/about/`
- `/contact/`
- `/privacy-policy/`
- `/terms/`
- `/refund-policy/`
- `/shipping-delivery/`
- `/cookie-policy/`
- `/disclaimer/`
- `/grievance-redressal/`
- `/accessibility/`
- `/corporate-information/`

The supplied authoritative `biznexa-legal-pages.docx` was not present in the inspected workspace. Until it is provided, legal route pages clearly indicate that their authoritative wording is pending; this project does not invent or substitute legal terms.

## Environment variables

The GitHub Pages release has no runtime environment variables. `saas-backend/.env.example` is for the separate future backend only and must never be copied into the static deployment artifact. Never commit a populated `.env` file or payment credentials.

## Future payment architecture

Future premium delivery requires a backend, database, user/session identity, provider-side payment verification, durable entitlements, and protected APIs that serve premium report data only after server-side authorization. The frontend `AccessProvider` is the intended boundary for a future entitlement provider; localStorage is not authorization.
