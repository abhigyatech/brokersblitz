import crypto from 'crypto';
import { query } from '../db/postgres';

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

export async function saveRechargeOrder(order: StoredRechargeOrder): Promise<void> {
  try {
    await query(
      `INSERT INTO public.wallet_recharge_orders (
        order_id, broker_id, pack_id, amount, credits,
        bonus_credits, bonus_expiry_days, is_mock, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        now(), now()
      )
      ON CONFLICT (order_id) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = now()`,
      [
        order.orderId,
        order.brokerId,
        order.packId,
        order.amountInInr,
        order.paidCredits,
        order.bonusCredits,
        order.bonusExpiryDays,
        order.isMock,
        order.status,
      ]
    );
  } catch {}
}

export async function getRechargeOrder(orderId: string): Promise<StoredRechargeOrder | undefined> {
  try {
    const res = await query(
      `SELECT * FROM public.wallet_recharge_orders WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      orderId: row.order_id,
      brokerId: row.broker_id,
      packId: row.pack_id || 'pack_starter',
      amountInInr: Number(row.amount),
      paidCredits: Number(row.credits),
      bonusCredits: Number(row.bonus_credits) || 0,
      bonusExpiryDays: Number(row.bonus_expiry_days) || 0,
      isMock: Boolean(row.is_mock),
      status: row.status as 'created' | 'paid' | 'verified',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

function cleanEnv(val?: string) {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

export function getRazorpayCredentials() {
  const keyId = cleanEnv(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const keySecret = cleanEnv(process.env.RAZORPAY_KEY_SECRET);
  const webhookSecret = cleanEnv(process.env.RAZORPAY_WEBHOOK_SECRET);
  const isMock = !keyId || keyId.includes('Mock') || !keySecret || keySecret.includes('mock');

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

  if (!isMock && keyId && keySecret) {
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
