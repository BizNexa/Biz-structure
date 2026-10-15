# Cashfree setup — ₹49 full report

The assessment page opens Cashfree’s hosted checkout. The App ID and Secret Key stay on the server. They are never placed in HTML, JavaScript, GitHub, or the browser.

The price is fixed on the server at ₹49 (4,900 paise). A return to the website does not unlock the report. The server asks Cashfree for the order and the payment, and unlocks only when Cashfree reports `PAID`, a `SUCCESS` payment, INR, and exactly ₹49. The webhook signature is checked, and the same Cashfree lookup is repeated before access is granted.

## Where the keys go

1. Copy `saas-backend/.env.example` to `saas-backend/.env` on the machine that runs the backend. `.env` is gitignored.
2. Set `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` from the Cashfree dashboard. Do not commit that file or paste the secret into the website.
3. Start with `CASHFREE_ENV=sandbox` and a sandbox payment. Switch to `production` only after that payment unlocks the report. Production `FRONTEND_URL` must be `https://www.bizmatrix.in/assessment/`.
4. In Cashfree, set the webhook to `https://YOUR-BACKEND/api/cashfree/webhook`. Put the same HTTPS URL in `CASHFREE_WEBHOOK_URL`.

GitHub Pages only serves the website. It cannot run this backend or keep the secret safe. Host `saas-backend` on a private Node.js server, then set `window.BIZ_API_BASE_URL` in `js/config.js` to that server’s HTTPS origin. Leave the secret out of `config.js`.

## What an outside caller cannot do

- Change the price. The browser amount is ignored.
- Unlock the report with a fake return URL or a copied webhook body. Access requires Cashfree’s own status for that order.
- Read another buyer’s order. The session token is required, and the order must belong to that session.
- Download the full catalog. It is loaded from `saas-backend/private/`, which is not published.
