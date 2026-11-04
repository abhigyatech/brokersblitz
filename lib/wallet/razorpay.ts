import crypto from 'crypto';
import { readJsonFile, writeJsonFile } from '../db/json-store';

export interface RechargePack {
  id: string;
  name: string;
  amountInInr: number;
  paidCredits: number;
  bonusCredits: number;
  bonusExpiryDays: number;
  badge?: string;
  popular?: boolean;
}

export interface StoredRechargeOrder {
  orderId: string;
  brokerId: string;
  packId: string;
  amountInInr: number;
  paidCredits: number;
  bonusCredits: number;
  bonusExpiryDays: number;
  isMock: boolean;
  status: 'created' | 'paid' | 'verified';
  createdAt: string;
  updatedAt: string;
}

export const RECHARGE_PACKS: RechargePack[] = [
  {
    id: 'pack_starter',
    name: 'Starter Trial',
    amountInInr: 500,
    paidCredits: 500,
    bonusCredits: 0,
    bonusExpiryDays: 0,
    badge: 'Standard',
  },
  {
    id: 'pack_growth',
    name: 'Growth Pack',
    amountInInr: 1000,
    paidCredits: 1000,
    bonusCredits: 100,
    bonusExpiryDays: 30,
    badge: '+100 Bonus',
    popular: true,
  },
  {
    id: 'pack_pro',
    name: 'Pro Real Estate Pack',
    amountInInr: 2500,
    paidCredits: 2500,
    bonusCredits: 300,
    bonusExpiryDays: 60,
    badge: '+300 Bonus',
  },
  {
    id: 'pack_elite',
    name: 'Enterprise Advisory Pack',
    amountInInr: 5000,
    paidCredits: 5000,
    bonusCredits: 1000,
    bonusExpiryDays: 90,
    badge: '+1000 Bonus',
  },
];

export function saveRechargeOrder(order: StoredRechargeOrder): void {
  try {
    const orders = readJsonFile<StoredRechargeOrder[]>('wallet_orders.json', []);
    const idx = orders.findIndex((o) => o.orderId === order.orderId);
    if (idx >= 0) {
      orders[idx] = order;
    } else {
      orders.push(order);
    }
    writeJsonFile('wallet_orders.json', orders);
  } catch {}
}

export function getRechargeOrder(orderId: string): StoredRechargeOrder | undefined {
  try {
    const orders = readJsonFile<StoredRechargeOrder[]>('wallet_orders.json', []);
    return orders.find((o) => o.orderId === orderId);
  } catch {
    return undefined;
  }
}

function cleanEnv(val?: string) {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

export function getRazorpayCredentials() {
  const keyId = cleanEnv(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) || 'rzp_test_51MockBrokersBlitz';
  const keySecret = cleanEnv(process.env.RAZORPAY_KEY_SECRET) || 'mock_secret_BrokersBlitz2026SecureKey';
  const webhookSecret = cleanEnv(process.env.RAZORPAY_WEBHOOK_SECRET) || 'mock_webhook_secret_BrokersBlitz';
  const isMock = keyId.includes('Mock') || keySecret.includes('mock');

  return { keyId, keySecret, webhookSecret, isMock };
}

export async function createRazorpayOrder(params: {
  amountInInr: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{
  orderId: string;
  amountInPaise: number;
  currency: string;
  isMock: boolean;
}> {
  const { keyId, keySecret, isMock } = getRazorpayCredentials();
  const amountInPaise = Math.round(params.amountInInr * 100);
  const currency = params.currency || 'INR';

  if (!isMock && !keyId.startsWith('rzp_test_51Mock')) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: params.receipt,
          notes: params.notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          orderId: data.id,
          amountInPaise: data.amount,
          currency: data.currency,
          isMock: false,
        };
      }
    } catch {}
  }

  const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId: mockOrderId,
    amountInPaise,
    currency,
    isMock: true,
  };
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret, isMock } = getRazorpayCredentials();

  if (isMock) {
    if (params.orderId.startsWith('order_mock_')) {
      return (
        params.signature.startsWith('mock_sig_') ||
        params.signature === 'mock_payment_signature_verified' ||
        params.signature.length > 5
      );
    }
  }

  try {
    const body = `${params.orderId}|${params.paymentId}`;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    return expected === params.signature;
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const { webhookSecret, isMock } = getRazorpayCredentials();
  if (isMock && signature.startsWith('mock_sig_')) {
    return true;
  }

  try {
    const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    return expected === signature;
  } catch {
    return false;
  }
}
