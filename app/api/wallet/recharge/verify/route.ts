import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../../lib/auth/user-store';
import { verifyPaymentSignature, RECHARGE_PACKS, getRechargeOrder, saveRechargeOrder } from '../../../../../lib/wallet/razorpay';
import { creditPaidBalance } from '../../../../../lib/wallet/wallet-service';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      packId,
      customAmount,
      amount,
    } = body;

    const effectiveCustom = customAmount !== undefined ? customAmount : amount;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ success: false, error: 'Missing payment identifiers' }, { status: 400 });
    }

    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature || '',
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay payment signature. Tampering detected.' },
        { status: 400 }
      );
    }

    const storedOrder = getRechargeOrder(razorpay_order_id);

    let pack = RECHARGE_PACKS.find((p) => p.id === (storedOrder?.packId || packId));
    let paidCredits = storedOrder ? storedOrder.paidCredits : pack ? pack.paidCredits : 500;
    let bonusCredits = storedOrder ? storedOrder.bonusCredits : pack ? pack.bonusCredits : 0;
    let bonusExpiryDays = storedOrder ? storedOrder.bonusExpiryDays : pack ? pack.bonusExpiryDays : 0;

    if (!storedOrder && !pack && effectiveCustom && typeof effectiveCustom === 'number' && effectiveCustom >= 1) {
      paidCredits = Math.round(effectiveCustom);
      bonusCredits = 0;
      bonusExpiryDays = 0;
    }

    if (storedOrder) {
      storedOrder.status = 'verified';
      storedOrder.updatedAt = new Date().toISOString();
      saveRechargeOrder(storedOrder);
    }

    const result = await creditPaidBalance(user.id, paidCredits, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      packId: storedOrder?.packId || pack?.id || 'pack_custom',
      bonusCredits,
      bonusExpiryDays,
      invoiceAmount: storedOrder?.amountInInr || paidCredits,
    });

    return NextResponse.json({
      success: true,
      message: `Recharge successful! Added ${paidCredits} Paid Credits${bonusCredits > 0 ? ` and ${bonusCredits} Free Promotional Credits` : ''}.`,
      wallet: result.wallet,
      transaction: result.transaction,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 });
  }
}

