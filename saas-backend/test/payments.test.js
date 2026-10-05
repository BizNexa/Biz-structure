import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createApp } from '../app.js';
import { createStore } from '../store.js';
import { createPhonePeGateway, PRICE_PAISE } from '../phonepe.js';

async function fixture(t, options = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'bizmatrix-payment-test-'));
  const store = createStore({ directory });
  const requests = [];
  const statuses = new Map();
  const gateway = {
    configured: true, webhookConfigured: true,
    async createOrder(id, redirect) {
      requests.push({ id, redirect });
      statuses.set(id, { orderId: 'PG_' + id, merchantOrderId: id, amount: 4900, state: 'PENDING' });
      return { orderId: 'PG_' + id, redirectUrl: 'https://mercury.phonepe.com/checkout/' + id };
    },
    async getOrderStatus(id) { return statuses.get(id); },
    validateCallback(auth, body) { if (auth !== 'valid-test-callback') throw new Error('Invalid callback'); return JSON.parse(body); },
    ...options.gateway
  };
  const app = createApp({ store, gateway, mode: 'sandbox', frontendUrl: 'https://bizmatrix.in/', allowedOrigins: ['https://bizmatrix.in'], catalog: { version: 1, entities: { private_limited: { private: 'paid-data' } }, registrations: { groups: [] } }, siteRoot: path.resolve('..'), ...options });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); rmSync(directory, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(url, token, body, headers = {}) {
    const response = await fetch(base + url, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = (response.headers.get('content-type') || '').includes('json') ? await response.json() : await response.text();
    return { status: response.status, body: result, headers: response.headers };
  }
  const session = async () => (await request('/api/session', null, {})).body.token;
  return { store, requests, statuses, request, session };
}

test('price is fixed at 4900 paise and duplicate checkout is reused', async t => {
  const f = await fixture(t); const token = await f.session();
  const first = await f.request('/api/orders', token, { amount: 1, email: 'buyer@example.com' });
  assert.equal(first.status, 201); assert.equal(first.body.amount, PRICE_PAISE);
  assert.equal(f.store.getOrder(first.body.orderId).amount, 4900);
  assert.equal(new URL(f.requests[0].redirect).searchParams.get('phonepe_order_id'), first.body.orderId);
  const second = await f.request('/api/orders', token, { amount: 0 });
  assert.equal(second.body.orderId, first.body.orderId); assert.equal(f.requests.length, 1);
});

test('free sessions and forged tokens cannot fetch premium data', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/api/premium/content')).status, 401);
  assert.equal((await f.request('/api/premium/content', 'x'.repeat(43))).status, 401);
  const free = await f.request('/api/premium/content', await f.session());
  assert.equal(free.status, 403); assert.equal(free.headers.get('cache-control'), 'no-store');
});

test('retry checks a delayed completed payment before creating another charge', async t => {
  const f = await fixture(t); const token = await f.session();
  const { orderId } = (await f.request('/api/orders', token, {})).body;
  f.statuses.get(orderId).state = 'COMPLETED';
  const retry = await f.request('/api/orders', token, {});
  assert.equal(retry.body.alreadyPaid, true); assert.equal(retry.body.premium, true);
  assert.equal(f.requests.length, 1);
});

test('pending and failed payments do not unlock; another session cannot verify an order', async t => {
  const f = await fixture(t); const token = await f.session();
  const { orderId } = (await f.request('/api/orders', token, {})).body;
  const pending = await f.request('/api/orders/' + orderId + '/verify', token, {});
  assert.equal(pending.body.state, 'PENDING'); assert.equal(pending.body.premium, false);
  assert.equal((await f.request('/api/orders/' + orderId + '/verify', await f.session(), {})).status, 404);
  f.statuses.get(orderId).state = 'FAILED';
  assert.equal((await f.request('/api/orders/' + orderId + '/verify', token, {})).body.premium, false);
});

test('mismatched provider amount, provider id and merchant id fail verification', async t => {
  const f = await fixture(t); const token = await f.session();
  const { orderId } = (await f.request('/api/orders', token, {})).body;
  const valid = { ...f.statuses.get(orderId), state: 'COMPLETED' };
  for (const mismatch of [{ amount: 1 }, { orderId: 'other-provider-order' }, { merchantOrderId: 'other-merchant-order' }]) {
    f.statuses.set(orderId, { ...valid, ...mismatch });
    assert.equal((await f.request('/api/orders/' + orderId + '/verify', token, {})).status, 502);
    assert.equal((await f.request('/api/access', token)).body.premium, false);
  }
});

test('verified payment unlocks content and purchase restoration without another charge', async t => {
  const f = await fixture(t); const token = await f.session();
  const { orderId } = (await f.request('/api/orders', token, {})).body;
  f.statuses.get(orderId).state = 'COMPLETED';
  const paid = await f.request('/api/orders/' + orderId + '/verify', token, {});
  assert.equal(paid.body.premium, true); assert.equal(paid.body.receipt.amount, 4900);
  assert.match(paid.body.receipt.recoveryCode, /^BIZ-[A-Za-z0-9_-]{43}$/);
  assert.equal((await f.request('/api/premium/content', token)).body.entities.private_limited.private, 'paid-data');
  const restoredToken = await f.session();
  assert.equal((await f.request('/api/restore-access', restoredToken, { code: 'invalid' })).status, 403);
  assert.equal((await f.request('/api/restore-access', restoredToken, { code: paid.body.receipt.recoveryCode })).body.premium, true);
  assert.equal((await f.request('/api/orders', restoredToken, {})).body.alreadyPaid, true);
  assert.equal(f.requests.length, 1);
});

test('webhook must authenticate and independently verify; repeated callbacks are idempotent', async t => {
  const f = await fixture(t); const token = await f.session();
  const { orderId } = (await f.request('/api/orders', token, {})).body;
  const callback = { event: 'checkout.order.completed', payload: { merchantOrderId: orderId, orderId: 'PG_' + orderId } };
  assert.equal((await f.request('/api/phonepe/webhook', null, callback)).status, 401);
  const send = body => f.request('/api/phonepe/webhook', null, body, { Authorization: 'valid-test-callback' });
  assert.equal((await send(callback)).status, 200);
  assert.equal((await f.request('/api/access', token)).body.premium, false, 'Callback text alone must not grant access');
  f.statuses.get(orderId).state = 'COMPLETED';
  for (const event of ['checkout.order.completed', 'CHECKOUT_ORDER_COMPLETED', 'PG_ORDER_COMPLETED', 0]) assert.equal((await send({ type: event, payload: callback.payload })).status, 200);
  const receipt = (await f.request('/api/access', token)).body.receipt;
  assert.equal((await send(callback)).status, 200);
  assert.deepEqual((await f.request('/api/access', token)).body.receipt, receipt);
  assert.equal((await send({ ...callback, payload: { ...callback.payload, orderId: 'wrong' } })).status, 400);
});

test('offline checkout, invalid email, disallowed origins and private paths are rejected', async t => {
  const f = await fixture(t); const token = await f.session();
  assert.equal((await f.request('/api/orders', token, { email: 'bad-email' })).status, 400);
  assert.equal((await f.request('/api/config', null, undefined, { Origin: 'https://untrusted.example' })).status, 403);
  for (const url of ['/saas-backend/private/catalog.json', '/saas-backend/data/purchases.sqlite', '/.env', '/.git/config', '/tools/prepare-premium.cjs', '/api/download/zip']) assert.equal((await f.request(url)).status, 404);
  const offline = await fixture(t, { gateway: { configured: false } });
  assert.equal((await offline.request('/api/config')).body.available, false);
  assert.equal((await offline.request('/api/orders', await offline.session(), {})).status, 503);
});

test('purchases and restoration survive restarts; sandbox purchases cannot unlock production', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bizmatrix-store-test-'));
  let store = createStore({ directory });
  try {
    const session = store.createSession();
    store.createOrder('durable-order', session.id, 'sandbox', '');
    store.completeOrder(store.getOrder('durable-order'));
    const code = store.getEntitlement(session.id, 'sandbox').recoveryCode;
    store.close(); store = createStore({ directory });
    assert.ok(store.getSession(session.token));
    assert.equal(store.getEntitlement(session.id, 'sandbox').recoveryCode, code);
    assert.equal(store.getEntitlement(session.id, 'production'), null);
    const other = store.createSession();
    assert.equal(store.restore(other.id, 'production', code), false);
    assert.equal(store.restore(other.id, 'sandbox', code), true);
    store.setState('durable-order', 'FAILED');
    assert.ok(store.getEntitlement(other.id, 'sandbox'), 'A replay cannot downgrade a completed payment');
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('official PhonePe SDK validates callback authentication without making API calls', () => {
  const gateway = createPhonePeGateway({ clientId: 'unit-test-client', clientSecret: 'unit-test-secret', clientVersion: 1, mode: 'sandbox', webhookUsername: 'test-user', webhookPassword: 'test-password' });
  const body = JSON.stringify({ event: 'checkout.order.completed', payload: { merchantOrderId: 'test-order' } });
  const authorization = createHash('sha256').update('test-user:test-password').digest('hex');
  assert.equal(gateway.validateCallback(authorization, body).payload.merchantOrderId, 'test-order');
  assert.throws(() => gateway.validateCallback('invalid', body));
});
