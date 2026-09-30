import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

const required = ['CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET', 'ACCESS_TOKEN_SECRET'];
for (const key of required) if (!process.env[key]) console.warn(`Missing ${key}; payment endpoints are disabled until it is set.`);
const app = express();
const port = Number(process.env.PORT || 3000);
const mode = process.env.CASHFREE_MODE === 'production' ? 'production' : 'sandbox';
const cashfreeBase = mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
const cashfree = new Cashfree(mode === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX, process.env.CASHFREE_CLIENT_ID, process.env.CASHFREE_CLIENT_SECRET);

app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('Origin not allowed')); }, methods: ['GET', 'POST'] }));

/* This route deliberately precedes express.json: Cashfree's signature is
   calculated over the exact raw body. Store confirmed orders in a database in
   a production deployment and make fulfillment idempotent by order_id. */
app.post('/api/webhook', express.raw({ type: 'application/json', limit: '64kb' }), (req, res) => {
  const signature = req.get('x-webhook-signature');
  const timestamp = req.get('x-webhook-timestamp');
  if (!signature || !timestamp) return res.status(400).send('Missing Cashfree signature headers');
  try {
    const event = cashfree.PGVerifyWebhookSignature(signature, req.body.toString('utf8'), timestamp);
    console.info('Verified Cashfree webhook', event?.object?.type || event?.type || 'unknown');
    return res.status(200).send('OK');
  } catch (err) {
    console.warn('Rejected Cashfree webhook:', err.message);
    return res.status(400).send('Invalid webhook signature');
  }
});
app.use(express.json({ limit: '32kb' }));

const validText = value => typeof value === 'string' && value.trim().length > 0;
const cashfreeHeaders = () => ({ 'content-type': 'application/json', 'x-client-id': process.env.CASHFREE_CLIENT_ID, 'x-client-secret': process.env.CASHFREE_CLIENT_SECRET, 'x-api-version': '2023-08-01' });
const accessToken = payload => { const body = Buffer.from(JSON.stringify(payload)).toString('base64url'); const signature = crypto.createHmac('sha256', process.env.ACCESS_TOKEN_SECRET).update(body).digest('base64url'); return `${body}.${signature}`; };

app.get('/health', (_req, res) => res.json({ ok: true, mode }));

app.post('/api/create-order', async (req, res) => {
  const { customer_name, customer_email, customer_phone, assessment_summary } = req.body || {};
  if (!validText(customer_name) || !/^\S+@\S+\.\S+$/.test(customer_email || '') || !/^[6-9]\d{9}$/.test(customer_phone || '')) return res.status(400).json({ error: 'Provide a full name, valid email, and 10-digit Indian mobile number.' });
  if (!required.every(key => process.env[key])) return res.status(503).json({ error: 'Payments are not configured on the server.' });
  const order_id = `ORD_BIZ_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const payload = { order_id, order_amount: 49, order_currency: 'INR', customer_details: { customer_id: `cust_${crypto.randomUUID()}`, customer_name: customer_name.trim().slice(0, 80), customer_email: customer_email.trim().toLowerCase(), customer_phone }, order_meta: { return_url: `${process.env.RETURN_URL || 'http://localhost:3000'}?order_id={order_id}` }, order_note: 'Business Structure Premium Plan Unlock', order_tags: { assessment: JSON.stringify(assessment_summary || {}).slice(0, 200) } };
  try {
    const response = await fetch(`${cashfreeBase}/orders`, { method: 'POST', headers: { ...cashfreeHeaders(), 'x-idempotency-key': crypto.randomUUID() }, body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok) { console.error('Cashfree create-order error', body); return res.status(502).json({ error: 'Cashfree could not create the payment order.' }); }
    res.status(201).json({ payment_session_id: body.payment_session_id, order_id, mode });
  } catch (err) { console.error('Cashfree create-order request failed', err); res.status(502).json({ error: 'Payment service is temporarily unavailable.' }); }
});

app.post('/api/verify-payment', async (req, res) => {
  const { order_id } = req.body || {};
  if (!/^ORD_BIZ_[A-Za-z0-9_]+$/.test(order_id || '')) return res.status(400).json({ error: 'Invalid order reference.' });
  try {
    const response = await fetch(`${cashfreeBase}/orders/${encodeURIComponent(order_id)}`, { headers: cashfreeHeaders() });
    const body = await response.json();
    if (!response.ok) return res.status(502).json({ error: 'Could not confirm payment status.' });
    if (body.order_status !== 'PAID') return res.status(402).json({ success: false, status: body.order_status, error: 'Payment is not confirmed yet.' });
    const token = accessToken({ order_id, paid_at: body.order_expiry_time || new Date().toISOString(), exp: Date.now() + 1000 * 60 * 60 * 24 * 365 });
    res.json({ success: true, status: 'PAID', token });
  } catch (err) { console.error('Cashfree verify-payment request failed', err); res.status(502).json({ error: 'Payment verification is temporarily unavailable.' }); }
});

app.use((err, _req, res, _next) => { console.error(err.message); res.status(403).json({ error: 'Request rejected.' }); });
app.listen(port, () => console.log(`Cashfree backend listening on ${port} (${mode})`));
