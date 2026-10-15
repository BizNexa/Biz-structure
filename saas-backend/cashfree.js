import { createHmac, timingSafeEqual } from 'node:crypto';

export const PRICE_PAISE = 4900;
export const PRICE_RUPEES = 49;
const API_VERSION = '2025-01-01';

const hosts = { sandbox: 'https://sandbox.cashfree.com', production: 'https://api.cashfree.com' };

const paise = amount => Math.round(Number(amount) * 100);

export function verifyCashfreeSignature(secret, timestamp, rawBody, signature) {
  const sent = Number(timestamp);
  const millis = sent < 1e12 ? sent * 1000 : sent;
  if (!Number.isFinite(sent) || Math.abs(Date.now() - millis) > 10 * 60 * 1000 || !signature || !secret) throw new Error('Missing Cashfree signature.');
  const expected = createHmac('sha256', secret).update(String(timestamp) + rawBody).digest('base64');
  const left = Buffer.from(expected);
  const right = Buffer.from(String(signature));
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error('Invalid Cashfree signature.');
}

export function createCashfreeGateway(config) {
  const mode = config.mode === 'production' ? 'production' : 'sandbox';
  const configured = Boolean(config.appId && config.secretKey);
  const base = hosts[mode] + '/pg';
  async function call(method, pathname, body) {
    const response = await fetch(base + pathname, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-api-version': API_VERSION, 'x-client-id': config.appId, 'x-client-secret': config.secretKey },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Cashfree request failed.');
    return result;
  }
  return {
    configured,
    webhookConfigured: configured,
    mode,
    async createOrder({ orderId, returnUrl, notifyUrl, customer }) {
      const order = await call('POST', '/orders', {
        order_id: orderId,
        order_amount: PRICE_RUPEES,
        order_currency: 'INR',
        customer_details: { customer_id: customer.id, customer_name: customer.name, customer_email: customer.email, customer_phone: customer.phone },
        order_meta: { return_url: returnUrl, ...(notifyUrl ? { notify_url: notifyUrl } : {}) },
        order_note: 'Biz Matrix full report'
      });
      if (!order.payment_session_id || !order.cf_order_id || order.order_currency !== 'INR' || paise(order.order_amount) !== PRICE_PAISE) throw new Error('Cashfree did not confirm the Rs. 49 order.');
      return { orderId: String(order.cf_order_id), paymentSessionId: order.payment_session_id };
    },
    async getOrderStatus(merchantOrderId) {
      const order = await call('GET', '/orders/' + encodeURIComponent(merchantOrderId));
      const payments = await call('GET', '/orders/' + encodeURIComponent(merchantOrderId) + '/payments');
      const list = Array.isArray(payments) ? payments : [];
      const paid = list.some(payment => payment.payment_status === 'SUCCESS' && payment.payment_currency === 'INR' && paise(payment.payment_amount) === PRICE_PAISE);
      let state = 'PENDING';
      if (order.order_status === 'PAID' && paid && order.order_currency === 'INR' && paise(order.order_amount) === PRICE_PAISE) state = 'COMPLETED';
      else if (order.order_status === 'EXPIRED') state = 'EXPIRED';
      else if (order.order_status === 'TERMINATED') state = 'FAILED';
      return { amount: paise(order.order_amount), orderId: String(order.cf_order_id || ''), merchantOrderId: order.order_id, state };
    },
    validateCallback(timestamp, rawBody, signature) {
      verifyCashfreeSignature(config.secretKey, timestamp, rawBody, signature);
      return JSON.parse(rawBody);
    }
  };
}
