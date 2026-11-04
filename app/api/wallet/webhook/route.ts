import { NextResponse } from 'next/server';
import { verifyWebhookSignature, getRechargeOrder, RECHARGE_PACKS } from '../../../../lib/wallet/razorpay';
import { creditPaidBalance } from '../../../../lib/wallet/wallet-service';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes || {};
      const orderId = payment?.order_id || event.payload?.order?.entity?.id;
      const paymentId = payment?.id;
      const amountInPaise = payment?.amount || 0;
      const amountInInr = Math.floor(amountInPaise / 100);

      const storedOrder = orderId ? getRechargeOrder(orderId) : undefined;
      const brokerId = storedOrder?.brokerId || notes.brokerId;

      if (brokerId && paymentId && orderId && amountInInr > 0) {
        let pack = storedOrder
          ? RECHARGE_PACKS.find((p) => p.id === storedOrder.packId)
          : notes.packId
          ? RECHARGE_PACKS.find((p) => p.id === notes.packId)
          : undefined;

        const paidCredits = storedOrder?.paidCredits || (pack ? pack.paidCredits : amountInInr);
        const bonusCredits = storedOrder?.bonusCredits || (pack ? pack.bonusCredits : 0);
        const bonusExpiryDays = storedOrder?.bonusExpiryDays || (pack ? pack.bonusExpiryDays : 0);

        await creditPaidBalance(brokerId, paidCredits, {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          packId: pack?.id || notes.packId || 'pack_webhook',
          bonusCredits,
          bonusExpiryDays,
          invoiceAmount: amountInInr,
        });
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

