import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, loadPremiumCatalog } from './app.js';
import { createStore } from './store.js';
import { createPhonePeGateway } from './phonepe.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(directory, '.env') });
const mode = process.env.PHONEPE_ENV || 'sandbox';
if (!['sandbox', 'production'].includes(mode)) throw new Error('PHONEPE_ENV must be sandbox or production.');
const port = Number(process.env.PORT || 3000);
const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${port}/`;
const frontend = new URL(frontendUrl);
if (mode === 'production' && frontend.protocol !== 'https:') throw new Error('Production FRONTEND_URL must use HTTPS.');
const allowedOrigins = (process.env.FRONTEND_ORIGINS || `${frontend.origin},https://bizmatrix.in,https://www.bizmatrix.in`).split(',').map(value => value.trim()).filter(Boolean);
for (const origin of allowedOrigins) if (new URL(origin).origin !== origin) throw new Error('FRONTEND_ORIGINS must contain origins without paths or trailing slashes.');
const gateway = createPhonePeGateway({ mode, clientId: process.env.PHONEPE_CLIENT_ID, clientSecret: process.env.PHONEPE_CLIENT_SECRET, clientVersion: Number(process.env.PHONEPE_CLIENT_VERSION || 1), webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME, webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD });
const store = createStore({ directory: path.resolve(directory, process.env.DATA_DIR || 'data'), secret: process.env.APP_SECRET });
const catalog = loadPremiumCatalog(path.resolve(directory, process.env.PREMIUM_DIR || 'private'));
const app = createApp({ store, gateway, mode, frontendUrl, allowedOrigins, catalog, siteRoot: path.resolve(directory, '..'), trustProxyHops: Number(process.env.TRUST_PROXY_HOPS || 0) });
const server = app.listen(port, () => {
  console.log(`Biz Matrix: http://localhost:${port} (${mode})`);
  console.log(`PhonePe checkout: ${gateway.configured && catalog ? 'ready' : 'waiting for credentials or private content'}`);
});
const shutdown = () => server.close(() => { store.close(); process.exit(0); });
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
