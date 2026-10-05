import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, createHmac } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PRICE_PAISE } from './phonepe.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const SESSION_LIFETIME = 365 * 24 * 60 * 60 * 1000;

export function createStore({ directory, secret, now = Date.now }) {
  mkdirSync(directory, { recursive: true });
  const secretFile = path.join(directory, 'app-secret.key');
  if (!secret) {
    if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'), { mode: 0o600, flag: 'wx' });
    secret = readFileSync(secretFile, 'utf8').trim();
  }
  if (secret.length < 32) throw new Error('APP_SECRET must have at least 32 characters.');
  const db = new DatabaseSync(path.join(directory, 'purchases.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), mode TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount=4900), email TEXT, provider_id TEXT UNIQUE, checkout_url TEXT, state TEXT NOT NULL, created_at INTEGER NOT NULL, verified_at INTEGER);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_order ON orders(session_id,mode) WHERE state IN ('CREATED','PENDING');
    CREATE TABLE IF NOT EXISTS purchases (order_id TEXT PRIMARY KEY REFERENCES orders(id), mode TEXT NOT NULL, recovery_hash TEXT NOT NULL UNIQUE, paid_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS access_grants (session_id TEXT NOT NULL REFERENCES sessions(id), mode TEXT NOT NULL, order_id TEXT NOT NULL REFERENCES purchases(order_id), PRIMARY KEY(session_id,mode));`);
  const recoveryCode = order => 'BIZ-' + createHmac('sha256', secret).update(`bizmatrix-full-report|${order.mode}|${order.id}`).digest('base64url');
  const entitlement = (sessionId, mode) => db.prepare('SELECT o.id, o.mode, p.paid_at FROM access_grants g JOIN purchases p ON p.order_id=g.order_id JOIN orders o ON o.id=p.order_id WHERE g.session_id=? AND g.mode=? AND o.state=?').get(sessionId, mode, 'COMPLETED');
  return {
    close: () => db.close(),
    createSession() {
      const token = randomBytes(32).toString('base64url');
      const id = randomBytes(16).toString('hex');
      db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(id, hash(token), now() + SESSION_LIFETIME);
      return { id, token };
    },
    getSession(token) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
      return db.prepare('SELECT id FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(token), now()) || null;
    },
    getEntitlement(sessionId, mode) {
      const purchase = entitlement(sessionId, mode);
      return purchase ? { orderId: purchase.id, paidAt: purchase.paid_at, recoveryCode: recoveryCode(purchase), amount: PRICE_PAISE, currency: 'INR' } : null;
    },
    getOrder(id) { return db.prepare('SELECT * FROM orders WHERE id=?').get(id) || null; },
    getOrderByProviderId(id) { return db.prepare('SELECT * FROM orders WHERE provider_id=?').get(id) || null; },
    latestOrder(sessionId, mode) { return db.prepare('SELECT * FROM orders WHERE session_id=? AND mode=? ORDER BY created_at DESC, rowid DESC LIMIT 1').get(sessionId, mode) || null; },
    activeOrder(sessionId, mode) {
      db.prepare("UPDATE orders SET state='EXPIRED' WHERE session_id=? AND mode=? AND state IN ('CREATED','PENDING') AND created_at<?").run(sessionId, mode, now() - 20 * 60 * 1000);
      return db.prepare("SELECT * FROM orders WHERE session_id=? AND mode=? AND state IN ('CREATED','PENDING') ORDER BY created_at DESC LIMIT 1").get(sessionId, mode) || null;
    },
    createOrder(id, sessionId, mode, email) {
      db.prepare("INSERT INTO orders (id,session_id,mode,amount,email,state,created_at) VALUES (?,?,?,?,?,'CREATED',?)").run(id, sessionId, mode, PRICE_PAISE, email || null, now());
    },
    setCheckout(id, providerId, url) { db.prepare("UPDATE orders SET provider_id=?,checkout_url=?,state='PENDING' WHERE id=? AND state='CREATED'").run(providerId, url, id); },
    setState(id, state) { db.prepare("UPDATE orders SET state=? WHERE id=? AND state<>'COMPLETED'").run(state, id); },
    completeOrder(order) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare("UPDATE orders SET state='COMPLETED',verified_at=COALESCE(verified_at,?) WHERE id=?").run(now(), order.id);
        db.prepare('INSERT OR IGNORE INTO purchases VALUES (?,?,?,?)').run(order.id, order.mode, hash(recoveryCode(order)), now());
        db.prepare('INSERT OR REPLACE INTO access_grants VALUES (?,?,?)').run(order.session_id, order.mode, order.id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    restore(sessionId, mode, code) {
      if (typeof code !== 'string' || !/^BIZ-[A-Za-z0-9_-]{43}$/.test(code)) return false;
      const purchase = db.prepare("SELECT p.order_id FROM purchases p JOIN orders o ON o.id=p.order_id WHERE p.recovery_hash=? AND p.mode=? AND o.state='COMPLETED'").get(hash(code), mode);
      if (!purchase) return false;
      db.prepare('INSERT OR REPLACE INTO access_grants VALUES (?,?,?)').run(sessionId, mode, purchase.order_id);
      return true;
    }
  };
}
