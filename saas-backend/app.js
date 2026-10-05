import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PRICE_PAISE } from './phonepe.js';

const route = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const HttpError = (status, message) => Object.assign(new Error(message), { status });

export function loadPremiumCatalog(directory) {
  const file = path.join(directory, 'catalog.json');
  if (!existsSync(file)) return null;
  const catalog = JSON.parse(readFileSync(file, 'utf8'));
  if (catalog.version !== 1 || !catalog.entities?.private_limited || !Array.isArray(catalog.registrations?.groups)) throw new Error('Invalid private premium catalog.');
  return catalog;
}

export function createApp({ store, gateway, mode, frontendUrl, allowedOrigins, catalog, siteRoot, trustProxyHops = 0 }) {
  const app = express();
  app.disable('x-powered-by');
  if (trustProxyHops) app.set('trust proxy', trustProxyHops);
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(cors({ origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(HttpError(403, 'Origin is not allowed.'));
  }, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  const limiter = (limit, windowMs = 10 * 60 * 1000) => rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please try again shortly.' } });
  const auth = (req, res, next) => {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('Authorization') || '');
    const session = match && store.getSession(match[1]);
    if (!session) return res.status(401).json({ error: 'Your session has expired. Restore your purchase to continue.' });
    req.session = session;
    next();
  };
  const access = session => ({ premium: Boolean(store.getEntitlement(session.id, mode)), receipt: store.getEntitlement(session.id, mode), mode });
  const paid = (req, res, next) => {
    if (!store.getEntitlement(req.session.id, mode)) return res.status(403).json({ error: 'A verified Rs. 49 payment is required.' });
    next();
  };
  const ready = () => Boolean(gateway.configured && catalog);
  const reconcile = async order => {
    const status = await gateway.getOrderStatus(order.id);
    if (status.amount !== PRICE_PAISE || !status.orderId || (order.provider_id && status.orderId !== order.provider_id) || (status.merchantOrderId && status.merchantOrderId !== order.id)) throw HttpError(502, 'Payment details could not be verified. Please contact support with your order reference.');
    if (status.state === 'COMPLETED') store.completeOrder(order);
    else if (['FAILED', 'EXPIRED'].includes(status.state)) store.setState(order.id, status.state);
    return status.state;
  };

  // Authenticate the raw callback, then query PhonePe independently before granting access.
  app.post('/api/phonepe/webhook', limiter(300), express.raw({ type: 'application/json', limit: '64kb' }), route(async (req, res) => {
    if (!gateway.webhookConfigured) throw HttpError(503, 'Webhook credentials are not configured.');
    if (!Buffer.isBuffer(req.body)) throw HttpError(400, 'Expected a JSON callback.');
    let callback;
    try { callback = gateway.validateCallback(req.get('Authorization') || '', req.body.toString('utf8')); }
    catch { throw HttpError(401, 'Invalid callback authentication.'); }
    if (!['PG_ORDER_COMPLETED', 'PG_ORDER_FAILED', 'CHECKOUT_ORDER_COMPLETED', 'CHECKOUT_ORDER_FAILED', 'checkout.order.completed', 'checkout.order.failed', 0, 1, 6, 7].includes(callback.type ?? callback.event)) return res.json({ received: true });
    const payload = callback.payload || {};
    const order = payload.merchantOrderId ? store.getOrder(payload.merchantOrderId) : store.getOrderByProviderId(payload.orderId || '');
    if (!order || order.mode !== mode) return res.json({ received: true });
    if (payload.orderId && order.provider_id && payload.orderId !== order.provider_id) throw HttpError(400, 'Callback order mismatch.');
    await reconcile(order);
    res.json({ received: true });
  }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true, paymentsReady: ready(), premiumReady: Boolean(catalog), mode }));
  app.get('/api/config', (_req, res) => res.json({ provider: 'PhonePe', amount: PRICE_PAISE, currency: 'INR', available: ready(), mode }));
  app.post('/api/session', limiter(50), (_req, res) => {
    const { token } = store.createSession();
    res.status(201).json({ token });
  });
  app.get('/api/access', auth, (req, res) => res.json(access(req.session)));
  app.post('/api/orders', limiter(20), auth, route(async (req, res) => {
    if (!ready()) throw HttpError(503, 'Checkout is currently unavailable. Please try again later.');
    if (store.getEntitlement(req.session.id, mode)) return res.json({ ...access(req.session), alreadyPaid: true });
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) throw HttpError(400, 'Enter a valid email address.');
    const previous = store.latestOrder(req.session.id, mode);
    if (previous?.provider_id && previous.state !== 'COMPLETED') {
      const status = await reconcile(previous);
      if (status === 'COMPLETED') return res.json({ ...access(req.session), alreadyPaid: true });
      if (!['FAILED', 'EXPIRED'].includes(status)) return res.json({ orderId: previous.id, checkoutUrl: previous.checkout_url, amount: PRICE_PAISE, currency: 'INR' });
    }
    const active = store.activeOrder(req.session.id, mode);
    if (active?.checkout_url) return res.json({ orderId: active.id, checkoutUrl: active.checkout_url, amount: PRICE_PAISE, currency: 'INR' });
    if (active) throw HttpError(409, 'Your checkout is being prepared. Please try again shortly.');
    const orderId = 'BIZ_' + randomUUID().replaceAll('-', '');
    store.createOrder(orderId, req.session.id, mode, email);
    const redirect = new URL(frontendUrl);
    redirect.searchParams.set('phonepe_order_id', orderId);
    try {
      const result = await gateway.createOrder(orderId, redirect.href);
      const checkout = new URL(result.redirectUrl);
      if (checkout.protocol !== 'https:' || !checkout.hostname.endsWith('.phonepe.com') || !result.orderId) throw new Error('Invalid provider checkout response');
      store.setCheckout(orderId, result.orderId, checkout.href);
      res.status(201).json({ orderId, checkoutUrl: checkout.href, amount: PRICE_PAISE, currency: 'INR' });
    } catch {
      store.setState(orderId, 'FAILED');
      throw HttpError(502, 'PhonePe checkout could not be started. Please try again.');
    }
  }));
  app.post('/api/orders/:id/verify', limiter(120), auth, route(async (req, res) => {
    const order = store.getOrder(req.params.id);
    if (!order || order.session_id !== req.session.id || order.mode !== mode) throw HttpError(404, 'Order not found.');
    if (!gateway.configured) throw HttpError(503, 'Payment verification is currently unavailable.');
    const state = order.state === 'COMPLETED' ? 'COMPLETED' : await reconcile(order);
    res.json({ state, ...access(req.session) });
  }));
  app.post('/api/restore-access', limiter(10), auth, (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!store.restore(req.session.id, mode, code)) return res.status(403).json({ error: 'That access code could not be verified.' });
    res.json(access(req.session));
  });
  app.get('/api/premium/content', auth, paid, (_req, res) => {
    if (!catalog) return res.status(503).json({ error: 'The full report is temporarily unavailable.' });
    res.json(catalog);
  });

  if (siteRoot) {
    app.get('/js/config.js', (_req, res) => res.type('application/javascript').send("window.BIZ_API_BASE_URL = '';\n"));
    app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(siteRoot, 'index.html')));
    app.get('/favicon.svg', (_req, res) => res.sendFile(path.join(siteRoot, 'favicon.svg')));
    app.get('/site.css', (_req, res) => res.sendFile(path.join(siteRoot, 'site.css')));
    app.use('/css', express.static(path.join(siteRoot, 'css'), { dotfiles: 'deny', index: false }));
    app.use('/js', express.static(path.join(siteRoot, 'js'), { dotfiles: 'deny', index: false }));
    for (const page of ['about', 'contact', 'privacy-policy', 'terms', 'refund-policy', 'shipping-delivery', 'cookie-policy', 'disclaimer', 'grievance-redressal', 'accessibility', 'corporate-information']) app.use('/' + page, express.static(path.join(siteRoot, page), { dotfiles: 'deny' }));
  }
  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use((error, _req, res, _next) => {
    const status = error.status || 502;
    res.status(status).json({ error: status < 500 || error.status ? error.message : 'The payment service is temporarily unavailable. Please try again.' });
  });
  return app;
}
