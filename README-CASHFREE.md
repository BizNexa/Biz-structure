# Historical Cashfree notes - superseded by PhonePe

The current integration uses PhonePe. Follow [README-PHONEPE.md](README-PHONEPE.md), not the historical instructions below. The backend in `saas-backend/` has been replaced with the PhonePe implementation. `saas-frontend/` remains a historical prototype and is not loaded by the production site. GitHub Pages publishes the repository root.

GitHub Pages does not execute backend code. The PhonePe backend requires separate hosting, private data and credentials. Live payment testing must be completed before launch.

Do not treat browser-side hiding or localStorage values as proof of payment. A future release must implement and test server-side payment verification and entitlement checks before serving premium report data.

No populated `.env` file or payment credentials belong in this repository. `saas-backend/.env.example` contains placeholders only.
