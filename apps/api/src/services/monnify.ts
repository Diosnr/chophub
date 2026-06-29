import crypto from 'crypto';

const MONNIFY_BASE = process.env.MONNIFY_BASE || 'https://api.monnify.com';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || '';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || '';
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || '';
const MONNIFY_WEBHOOK_SECRET = process.env.MONNIFY_WEBHOOK_SECRET || '';

export function monnifyConfigured(): boolean {
  return Boolean(MONNIFY_API_KEY && MONNIFY_SECRET_KEY && MONNIFY_CONTRACT_CODE);
}

export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  const res = await fetch(`${MONNIFY_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });
  const data = (await res.json()) as { responseBody?: { accessToken?: string }; message?: string };
  if (!data.responseBody?.accessToken) {
    throw new Error(data.message || 'Failed to get Monnify access token');
  }
  return data.responseBody.accessToken;
}

export async function initializeTransaction(params: {
  amount: number;
  customerEmail: string;
  customerName: string;
  paymentReference: string;
  paymentDescription: string;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; paymentReference: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${MONNIFY_BASE}/api/v1/merchant/orders/initialize-transaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params,
      contractCode: MONNIFY_CONTRACT_CODE,
      currencyCode: 'NGN',
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
    }),
  });
  const data = (await res.json()) as {
    responseBody?: { checkoutUrl: string; paymentReference: string };
    message?: string;
  };
  if (!data.responseBody?.checkoutUrl) {
    throw new Error(data.message || 'Failed to initialize Monnify transaction');
  }
  return {
    checkoutUrl: data.responseBody.checkoutUrl,
    paymentReference: data.responseBody.paymentReference,
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!MONNIFY_WEBHOOK_SECRET || !signature) return false;
  const computed = crypto.createHmac('sha512', MONNIFY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}
