# Future Cashfree integration notes — not part of the current release

The current GitHub Pages release is static, payment-free, and contact-to-unlock only. Do not deploy `saas-frontend/` as the current website: it is a separate historical payment prototype, not the production Pages artifact. The production workflow publishes only `github-pages-deployment/`.

`saas-backend/` and the associated frontend prototype are retained for a later payment release. They are not deployed by the Pages workflow. Payment creation, verification, webhook persistence, authentication, database-backed entitlements, and protected premium-content delivery have not been approved or validated as production functionality.

Do not treat browser-side hiding or localStorage values as proof of payment. A future release must implement and test server-side payment verification and entitlement checks before serving premium report data.

No populated `.env` file or payment credentials belong in this repository. `saas-backend/.env.example` contains placeholders only.
