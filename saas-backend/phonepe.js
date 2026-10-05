import { StandardCheckoutClient, StandardCheckoutPayRequest, Env } from '@phonepe-pg/pg-sdk-node';

export const PRICE_PAISE = 4900;

export function createPhonePeGateway(config) {
  const configured = Boolean(config.clientId && config.clientSecret && Number.isInteger(config.clientVersion) && config.clientVersion > 0);
  const webhookConfigured = configured && Boolean(config.webhookUsername && config.webhookPassword);
  const client = configured ? StandardCheckoutClient.getInstance(config.clientId, config.clientSecret, config.clientVersion, config.mode === 'production' ? Env.PRODUCTION : Env.SANDBOX, false) : null;
  return {
    configured,
    webhookConfigured,
    async createOrder(merchantOrderId, redirectUrl) {
      const request = StandardCheckoutPayRequest.builder().merchantOrderId(merchantOrderId).amount(PRICE_PAISE).redirectUrl(redirectUrl).build();
      return client.pay(request);
    },
    async getOrderStatus(merchantOrderId) { return client.getOrderStatus(merchantOrderId); },
    validateCallback(authorization, rawBody) { return client.validateCallback(config.webhookUsername, config.webhookPassword, authorization, rawBody); }
  };
}
