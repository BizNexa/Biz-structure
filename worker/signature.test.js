import test from 'node:test';
import assert from 'node:assert/strict';
import { hmacBase64, verifyCashfreeSignature } from './index.js';

test('Cashfree webhook signature accepts the current timestamp and rejects a bad one', async () => {
  const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'BIZ_test' } } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await hmacBase64('unit-test-secret', timestamp + body);
  await verifyCashfreeSignature('unit-test-secret', timestamp, body, signature);
  await assert.rejects(() => verifyCashfreeSignature('unit-test-secret', timestamp, body, 'aaaa'));
  await assert.rejects(() => verifyCashfreeSignature('unit-test-secret', '1', body, signature));
});
