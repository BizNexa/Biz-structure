# PhonePe Setup - Rs. 49 Full Report and PDF

## What is implemented

The official [PhonePe Node SDK](https://github.com/PhonePe/phonepe-pg-sdk-node) creates Standard Checkout orders with the amount fixed server-side at 4,900 paise. A return redirect never grants access by itself. The backend independently checks the provider order status, amount and order identifiers before persisting an entitlement.

Completed purchases unlock every report section and full PDF generation for this FY 2026-27 edition. Failed/pending payments remain locked. No ZIP/folder download is exposed. PhonePe webhook authentication is validated through the SDK; repeated callbacks are idempotent and also trigger independent status verification.

## 1. Private report data

The full catalog has been prepared locally in `saas-backend/private/catalog.json`. It is intentionally absent from GitHub and the Pages artifact. When deploying, transfer **only this catalog** privately to the backend, not into a publicly served directory.

To regenerate it, install the external development parsers described in README.md and run:

```powershell
node tools/prepare-premium.cjs 'C:\private\commercial.html'
```

`PREMIUM_DIR` can point to an absolute private directory on the backend host. The backend refuses checkout until it can load a valid catalog.

## 2. Credentials

Copy the template locally, or configure the same variables in your host's secret settings:

```powershell
Copy-Item saas-backend/.env.example saas-backend/.env
```

Set `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET` and `PHONEPE_CLIENT_VERSION` using the credentials/version issued to your merchant account. These are server-only secrets, not frontend settings. Also set `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` to match the webhook configuration in PhonePe.

Start with `PHONEPE_ENV=sandbox`. Switch to `production` only with production credentials after successfully testing the real sandbox checkout and webhook. Do not mix environments: sandbox purchases cannot unlock production access.

For production:

```dotenv
NODE_ENV=production
PHONEPE_ENV=production
FRONTEND_URL=https://bizmatrix.in/
FRONTEND_ORIGINS=https://bizmatrix.in,https://www.bizmatrix.in
DATA_DIR=/your/persistent/private/data
PREMIUM_DIR=/your/private/report
```

Keep the price unchanged; it is not a browser-controlled environment variable. Refund handling remains a merchant/support process in PhonePe, not an automatic refund endpoint.

## 3. Backend hosting

Run this repository's Node backend on an HTTPS-capable host with persistent private storage:

```powershell
npm.cmd --prefix saas-backend ci --omit=dev
npm.cmd --prefix saas-backend start
```

On Linux, use `npm` instead of `npm.cmd`. Start command from the repository root: `node saas-backend/server.js`. There is no frontend build step. Set `PORT` as required by the host. If behind a reverse proxy, configure `TRUST_PROXY_HOPS` to the actual number of trusted proxy hops, not an arbitrary value.

The backend can serve the entire website or just be used as the API behind the existing GitHub Pages frontend. Its static whitelist does not expose `.env`, private content, databases, Git files or tooling. Keep the public GitHub repository free of the commercial source.

GitHub Pages cannot host Node/SQLite or keep payment secrets. Adding PhonePe credentials to GitHub Pages alone will not enable checkout.

## 4. Connect the Pages frontend

If using separate backend hosting, edit `js/config.js`:

```javascript
window.BIZ_API_BASE_URL = 'https://your-backend-host.example';
```

Use an origin without a trailing slash or path. Allow the real frontend origin in `FRONTEND_ORIGINS`. Set `FRONTEND_URL` to the assessment page that PhonePe should return to. The backend passes an order reference in that redirect, not credentials or an access token.

Leave the API base empty when the backend serves the whole site. It overrides this config with the same-origin setting for its own served frontend.

## 5. PhonePe webhook

Configure the HTTPS endpoint in your PhonePe merchant setup:

```text
https://your-backend-host.example/api/phonepe/webhook
```

Enable the checkout order-completed and order-failed callbacks available for your merchant integration, with the same webhook username/password configured on the backend. Preserve the JSON body and Authorization header through any proxy. The SDK authenticates the callback, and the backend queries order status before granting access.

The browser also verifies its own order on return and provides Check Payment Status for delayed confirmation. Checkout retries reconcile the previous order first to avoid charging again for an already completed payment.

## 6. Persistence and recovery

`DATA_DIR` contains `purchases.sqlite` and, unless `APP_SECRET` is supplied, an automatically generated `app-secret.key`. Both must persist across deploys/restarts. Keep secure backups using a SQLite-safe backup method. Do not put this directory in public storage.

Alternatively, set a stable secret of at least 32 characters in `APP_SECRET`. Do not rotate/delete it without a migration: recovery codes depend on it. Losing the database loses purchase records; losing/changing the secret invalidates previously displayed access codes.

Customers get a receipt with their private access code after payment. The current browser remembers an opaque token; it does not store an authorization flag or the full catalog. Restore Access supports another device using the code. A purchase does not send automatic email or WhatsApp delivery. Merchant support can investigate an order using the database and PhonePe records.

## Verification Before Launch

Automated coverage includes the 35% preview, checkout creation, fixed amount, owner-only verification, failed/pending/mismatched orders, webhook authentication/idempotency, restoration, database restart, environment isolation, protected content and full PDF generation. All seven sample PDF pages were rendered for visual inspection.

Real PhonePe API calls/transactions have **not** been tested without your credentials. Complete a sandbox purchase, a failed/cancelled purchase, a delayed callback and access restoration before production. Confirm Rs. 49 is displayed by PhonePe, verify the full PDF download on desktop/mobile, review the supplied policies and finish domain HTTPS setup. No browser automation surface was available here, so DOM tests do not replace that final browser check.
