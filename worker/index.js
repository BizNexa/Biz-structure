const PRICE_PAISE = 4900;
const PRICE_RUPEES = 49;
const API_VERSION = '2025-01-01';
const SESSION_LIFETIME = 365 * 24 * 60 * 60 * 1000;
const hosts = { sandbox: 'https://sandbox.cashfree.com', production: 'https://api.cashfree.com' };

const encoder = new TextEncoder();
let schemaReady;

export async function hmacBase64(secret, data) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signed)));
}

export async function verifyCashfreeSignature(secret, timestamp, rawBody, signature) {
  const sent = Number(timestamp);
  const millis = sent < 1e12 ? sent * 1000 : sent;
  if (!Number.isFinite(sent) || Math.abs(Date.now() - millis) > 10 * 60 * 1000 || !signature || !secret) throw new Error('Missing Cashfree signature.');
  const expected = await hmacBase64(secret, String(timestamp) + rawBody);
  const left = Uint8Array.from(atob(expected), char => char.charCodeAt(0));
  let right;
  try { right = Uint8Array.from(atob(signature), char => char.charCodeAt(0)); }
  catch { throw new Error('Invalid Cashfree signature.'); }
  if (left.length !== right.length) throw new Error('Invalid Cashfree signature.');
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  if (mismatch) throw new Error('Invalid Cashfree signature.');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacBase64Url(secret, data) {
  return (await hmacBase64(secret, data)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function randomBase64Url(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function randomHex(size) {
  return [...crypto.getRandomValues(new Uint8Array(size))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function ensureSchema(db) {
  if (!schemaReady) schemaReady = db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL)'),
    db.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, mode TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount=4900), email TEXT, provider_id TEXT UNIQUE, checkout_url TEXT, state TEXT NOT NULL, created_at INTEGER NOT NULL, verified_at INTEGER)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS one_active_order ON orders(session_id, mode) WHERE state IN ('CREATED', 'PENDING')"),
    db.prepare('CREATE TABLE IF NOT EXISTS purchases (order_id TEXT PRIMARY KEY, mode TEXT NOT NULL, recovery_hash TEXT NOT NULL UNIQUE, paid_at INTEGER NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS access_grants (session_id TEXT NOT NULL, mode TEXT NOT NULL, order_id TEXT NOT NULL, PRIMARY KEY(session_id, mode))'),
    db.prepare('CREATE TABLE IF NOT EXISTS catalog (id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS rate_limits (key TEXT NOT NULL, window_start INTEGER NOT NULL, hits INTEGER NOT NULL, PRIMARY KEY(key, window_start))')
  ]).catch(error => { schemaReady = undefined; throw error; });
  await schemaReady;
}

async function limited(db, key, limit) {
  const windowMs = 10 * 60 * 1000;
  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const row = await db.prepare('SELECT hits FROM rate_limits WHERE key = ? AND window_start = ?').bind(key, windowStart).first();
  if (row && row.hits >= limit) return false;
  await db.batch([
    db.prepare('INSERT INTO rate_limits (key, window_start, hits) VALUES (?, ?, 1) ON CONFLICT(key, window_start) DO UPDATE SET hits = hits + 1').bind(key, windowStart),
    db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - windowMs)
  ]);
  return true;
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || 'https://www.bizmatrix.in,https://bizmatrix.in').split(',').map(value => value.trim());
  if (!origin) return { origin: '', allowed: true };
  return { origin, allowed: allowed.includes(origin) };
}

function json(body, status, origin) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin'
  };
  if (origin) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function fail(status, message, origin) {
  return json({ error: message }, status, origin);
}

async function cashfree(env, method, pathname, body) {
  const mode = env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
  const response = await fetch(hosts[mode] + '/pg' + pathname, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-api-version': API_VERSION,
      'x-client-id': env.CASHFREE_APP_ID,
      'x-client-secret': env.CASHFREE_SECRET_KEY
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error('Cashfree request failed.'), { status: 502 });
  return result;
}

function paise(amount) {
  return Math.round(Number(amount) * 100);
}

async function orderStatus(env, merchantOrderId) {
  const order = await cashfree(env, 'GET', '/orders/' + encodeURIComponent(merchantOrderId));
  const payments = await cashfree(env, 'GET', '/orders/' + encodeURIComponent(merchantOrderId) + '/payments');
  const list = Array.isArray(payments) ? payments : [];
  const paid = list.some(payment => payment.payment_status === 'SUCCESS' && payment.payment_currency === 'INR' && paise(payment.payment_amount) === PRICE_PAISE);
  let state = 'PENDING';
  if (order.order_status === 'PAID' && paid && order.order_currency === 'INR' && paise(order.order_amount) === PRICE_PAISE) state = 'COMPLETED';
  else if (order.order_status === 'EXPIRED') state = 'EXPIRED';
  else if (order.order_status === 'TERMINATED') state = 'FAILED';
  return { amount: paise(order.order_amount), orderId: String(order.cf_order_id || ''), merchantOrderId: order.order_id, state };
}

async function recoveryCode(env, order) {
  return 'BIZ-' + await hmacBase64Url(env.APP_SECRET, `bizmatrix-full-report|${order.mode}|${order.id}`);
}

async function entitlement(db, env, sessionId, mode) {
  const purchase = await db.prepare("SELECT o.id, o.mode, p.paid_at FROM access_grants g JOIN purchases p ON p.order_id = g.order_id JOIN orders o ON o.id = p.order_id WHERE g.session_id = ? AND g.mode = ? AND o.state = 'COMPLETED'").bind(sessionId, mode).first();
  if (!purchase) return null;
  return { orderId: purchase.id, paidAt: purchase.paid_at, recoveryCode: await recoveryCode(env, purchase), amount: PRICE_PAISE, currency: 'INR' };
}

async function access(db, env, sessionId, mode) {
  const receipt = await entitlement(db, env, sessionId, mode);
  return { premium: Boolean(receipt), receipt, mode };
}

async function reconcile(db, env, order) {
  const status = await orderStatus(env, order.id);
  if (status.amount !== PRICE_PAISE || !status.orderId || (order.provider_id && status.orderId !== order.provider_id) || (status.merchantOrderId && status.merchantOrderId !== order.id)) {
    throw Object.assign(new Error('Payment details could not be verified. Please contact support with your order reference.'), { status: 502 });
  }
  if (status.state === 'COMPLETED') {
    const now = Date.now();
    const code = await recoveryCode(env, order);
    await db.batch([
      db.prepare("UPDATE orders SET state = 'COMPLETED', verified_at = COALESCE(verified_at, ?) WHERE id = ?").bind(now, order.id),
      db.prepare('INSERT OR IGNORE INTO purchases (order_id, mode, recovery_hash, paid_at) VALUES (?, ?, ?, ?)').bind(order.id, order.mode, await sha256Hex(code), now),
      db.prepare('INSERT OR REPLACE INTO access_grants (session_id, mode, order_id) VALUES (?, ?, ?)').bind(order.session_id, order.mode, order.id)
    ]);
  } else if (status.state === 'FAILED' || status.state === 'EXPIRED') {
    await db.prepare("UPDATE orders SET state = ? WHERE id = ? AND state <> 'COMPLETED'").bind(status.state, order.id).run();
  }
  return status.state;
}

async function sessionFrom(request, db) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization') || '');
  if (!match) return null;
  return db.prepare('SELECT id FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(await sha256Hex(match[1]), Date.now()).first();
}

let catalogCache;
async function readCatalog(db) {
  if (catalogCache) return catalogCache;
  const row = await db.prepare('SELECT body FROM catalog WHERE id = 1').first();
  if (!row) return null;
  const catalog = JSON.parse(row.body);
  if (catalog.version !== 1 || !catalog.entities?.private_limited || !Array.isArray(catalog.registrations?.groups)) return null;
  catalogCache = catalog;
  return catalog;
}

export default {
  async fetch(request, env) {
    const { origin, allowed } = allowedOrigin(request, env);
    if (request.method === 'OPTIONS') {
      if (!allowed) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: origin ? {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'Content-Type, Authorization',
          'access-control-max-age': '86400',
          vary: 'Origin'
        } : {}
      });
    }
    if (!allowed) return fail(403, 'Origin is not allowed.', '');
    if (!env.DB) return fail(503, 'Payment database is not connected.', origin);
    try {
      await ensureSchema(env.DB);
      return await route(request, env, origin);
    } catch (error) {
      const status = error.status || 502;
      const message = status < 500 || error.status ? error.message : 'The payment service is temporarily unavailable. Please try again.';
      return fail(status, message, origin);
    }
  }
};

async function route(request, env, origin) {
  const url = new URL(request.url);
  const mode = env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
  const configured = Boolean(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY && env.APP_SECRET && env.APP_SECRET.length >= 32);
  const db = env.DB;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const catalog = await readCatalog(db);
  const ready = configured && Boolean(catalog);

  if (request.method === 'POST' && url.pathname === '/api/cashfree/webhook') {
    if (!(await limited(db, 'webhook:' + ip, 300))) return fail(429, 'Too many requests. Please try again shortly.', origin);
    if (!configured) return fail(503, 'Webhook credentials are not configured.', origin);
    const raw = await request.text();
    if (raw.length > 65536) return fail(413, 'Payload is too large.', origin);
    let callback;
    try { await verifyCashfreeSignature(env.CASHFREE_SECRET_KEY, request.headers.get('x-webhook-timestamp') || '', raw, request.headers.get('x-webhook-signature') || ''); callback = JSON.parse(raw); }
    catch { return fail(401, 'Invalid callback authentication.', origin); }
    if (!['PAYMENT_SUCCESS_WEBHOOK', 'PAYMENT_FAILED_WEBHOOK', 'PAYMENT_USER_DROPPED_WEBHOOK'].includes(callback.type)) return json({ received: true }, 200, origin);
    const providerOrder = callback.data?.order || {};
    const order = providerOrder.order_id ? await db.prepare('SELECT * FROM orders WHERE id = ?').bind(providerOrder.order_id).first() : null;
    if (!order || order.mode !== mode) return json({ received: true }, 200, origin);
    if (providerOrder.cf_order_id && order.provider_id && String(providerOrder.cf_order_id) !== String(order.provider_id)) return fail(400, 'Callback order mismatch.', origin);
    await reconcile(db, env, order);
    return json({ received: true }, 200, origin);
  }

  if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, paymentsReady: ready, premiumReady: Boolean(catalog), mode }, 200, origin);
  if (request.method === 'GET' && url.pathname === '/api/config') return json({ provider: 'Cashfree', amount: PRICE_PAISE, currency: 'INR', available: ready, mode }, 200, origin);

  if (request.method === 'POST' && url.pathname === '/api/setup/catalog') {
    if (!env.SETUP_TOKEN || !(await tokensMatch(env.SETUP_TOKEN, (request.headers.get('Authorization') || '').replace(/^Bearer /, '')))) return fail(401, 'Setup credentials were not accepted.', origin);
    const raw = await request.text();
    if (raw.length > 6_000_000) return fail(413, 'Catalog is too large.', origin);
    const body = JSON.parse(raw);
    if (body.version !== 1 || !body.entities?.private_limited || !Array.isArray(body.registrations?.groups)) return fail(400, 'Invalid private premium catalog.', origin);
    await db.prepare('INSERT OR REPLACE INTO catalog (id, body) VALUES (1, ?)').bind(JSON.stringify(body)).run();
    catalogCache = body;
    return json({ ok: true }, 200, origin);
  }

  if (request.method === 'POST' && url.pathname === '/api/session') {
    if (!(await limited(db, 'session:' + ip, 50))) return fail(429, 'Too many requests. Please try again shortly.', origin);
    const token = randomBase64Url(32);
    const id = randomHex(16);
    await db.prepare('INSERT INTO sessions (id, token_hash, expires_at) VALUES (?, ?, ?)').bind(id, await sha256Hex(token), Date.now() + SESSION_LIFETIME).run();
    return json({ token }, 201, origin);
  }

  const session = await sessionFrom(request, db);
  if (!session) return fail(401, 'Your session has expired. Restore your purchase to continue.', origin);

  if (request.method === 'GET' && url.pathname === '/api/access') return json(await access(db, env, session.id, mode), 200, origin);
  if (request.method === 'GET' && url.pathname === '/api/premium/content') {
    const receipt = await entitlement(db, env, session.id, mode);
    if (!receipt) return fail(403, 'A verified Rs. 49 payment is required.', origin);
    if (!catalog) return fail(503, 'The full report is temporarily unavailable.', origin);
    return json(catalog, 200, origin);
  }

  if (request.method === 'POST' && url.pathname === '/api/orders') {
    if (!(await limited(db, 'orders:' + ip, 20))) return fail(429, 'Too many requests. Please try again shortly.', origin);
    if (!ready) return fail(503, 'Checkout is currently unavailable. Please try again later.', origin);
    if (await entitlement(db, env, session.id, mode)) return json({ ...(await access(db, env, session.id, mode)), alreadyPaid: true }, 200, origin);
    const body = await readJson(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    if (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) return fail(400, 'Enter a valid email address.', origin);
    const checkout = order => ({ orderId: order.id, paymentSessionId: order.checkout_url, amount: PRICE_PAISE, currency: 'INR', mode });
    const previous = await db.prepare('SELECT * FROM orders WHERE session_id = ? AND mode = ? ORDER BY created_at DESC, rowid DESC LIMIT 1').bind(session.id, mode).first();
    if (previous?.provider_id && previous.state !== 'COMPLETED') {
      const status = await reconcile(db, env, previous);
      if (status === 'COMPLETED') return json({ ...(await access(db, env, session.id, mode)), alreadyPaid: true }, 200, origin);
      if (!['FAILED', 'EXPIRED'].includes(status) && previous.checkout_url) return json(checkout(previous), 200, origin);
    }
    const cutoff = Date.now() - 20 * 60 * 1000;
    await db.prepare("UPDATE orders SET state = 'EXPIRED' WHERE session_id = ? AND mode = ? AND state IN ('CREATED', 'PENDING') AND created_at < ?").bind(session.id, mode, cutoff).run();
    const active = await db.prepare("SELECT * FROM orders WHERE session_id = ? AND mode = ? AND state IN ('CREATED', 'PENDING') ORDER BY created_at DESC LIMIT 1").bind(session.id, mode).first();
    if (active?.checkout_url) return json(checkout(active), 200, origin);
    if (active) return fail(409, 'Your checkout is being prepared. Please try again shortly.', origin);
    if (name.length < 2) return fail(400, 'Enter your full name.', origin);
    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return fail(400, 'Enter a valid email address.', origin);
    if (!/^[6-9]\d{9}$/.test(phone)) return fail(400, 'Enter a 10-digit Indian mobile number.', origin);
    const orderId = 'BIZ_' + crypto.randomUUID().replaceAll('-', '');
    await db.prepare("INSERT INTO orders (id, session_id, mode, amount, email, state, created_at) VALUES (?, ?, ?, ?, ?, 'CREATED', ?)").bind(orderId, session.id, mode, PRICE_PAISE, email, Date.now()).run();
    const frontend = new URL(env.FRONTEND_URL || 'https://www.bizmatrix.in/assessment/');
    const returnUrl = frontend.origin + frontend.pathname + '?cashfree_order_id={order_id}';
    const notifyUrl = new URL(request.url).origin + '/api/cashfree/webhook';
    try {
      const created = await cashfree(env, 'POST', '/orders', {
        order_id: orderId,
        order_amount: PRICE_RUPEES,
        order_currency: 'INR',
        customer_details: { customer_id: 'c' + session.id, customer_name: name.slice(0, 100), customer_email: email, customer_phone: phone },
        order_meta: { return_url: returnUrl, notify_url: notifyUrl },
        order_note: 'Biz Matrix full report'
      });
      if (!created.payment_session_id || !created.cf_order_id || created.order_currency !== 'INR' || paise(created.order_amount) !== PRICE_PAISE) throw new Error('Cashfree did not confirm the order.');
      await db.prepare("UPDATE orders SET provider_id = ?, checkout_url = ?, state = 'PENDING' WHERE id = ? AND state = 'CREATED'").bind(String(created.cf_order_id), created.payment_session_id, orderId).run();
      const stored = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
      return json(checkout(stored), 201, origin);
    } catch (error) {
      await db.prepare("UPDATE orders SET state = 'FAILED' WHERE id = ? AND state <> 'COMPLETED'").bind(orderId).run();
      if (error.status) throw error;
      return fail(502, 'Cashfree checkout could not be started. Please try again.', origin);
    }
  }

  const verify = /^\/api\/orders\/(BIZ_[a-f0-9]{32})\/verify$/.exec(url.pathname);
  if (request.method === 'POST' && verify) {
    if (!(await limited(db, 'verify:' + ip, 120))) return fail(429, 'Too many requests. Please try again shortly.', origin);
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(verify[1]).first();
    if (!order || order.session_id !== session.id || order.mode !== mode) return fail(404, 'Order not found.', origin);
    if (!configured) return fail(503, 'Payment verification is currently unavailable.', origin);
    const state = order.state === 'COMPLETED' ? 'COMPLETED' : await reconcile(db, env, order);
    return json({ state, ...(await access(db, env, session.id, mode)) }, 200, origin);
  }

  if (request.method === 'POST' && url.pathname === '/api/restore-access') {
    if (!(await limited(db, 'restore:' + ip, 10))) return fail(429, 'Too many requests. Please try again shortly.', origin);
    const body = await readJson(request);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!/^BIZ-[A-Za-z0-9_-]{43}$/.test(code)) return fail(403, 'That access code could not be verified.', origin);
    const purchase = await db.prepare("SELECT p.order_id FROM purchases p JOIN orders o ON o.id = p.order_id WHERE p.recovery_hash = ? AND p.mode = ? AND o.state = 'COMPLETED'").bind(await sha256Hex(code), mode).first();
    if (!purchase) return fail(403, 'That access code could not be verified.', origin);
    await db.prepare('INSERT OR REPLACE INTO access_grants (session_id, mode, order_id) VALUES (?, ?, ?)').bind(session.id, mode, purchase.order_id).run();
    return json(await access(db, env, session.id, mode), 200, origin);
  }

  return fail(404, 'Not found.', origin);
}

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > 16384) throw Object.assign(new Error('Payload is too large.'), { status: 413 });
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw Object.assign(new Error('Enter the required details.'), { status: 400 }); }
}

async function tokensMatch(expected, received) {
  const left = encoder.encode(expected);
  const right = encoder.encode(received);
  if (left.length !== right.length || left.length === 0) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}
