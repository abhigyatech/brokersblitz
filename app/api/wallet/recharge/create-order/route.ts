import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../../lib/auth/user-store';
import { createRazorpayOrder, RECHARGE_PACKS, getRazorpayCredentials, saveRechargeOrder } from '../../../../../lib/wallet/razorpay';
import { getOrCreateWallet } from '../../../../../lib/wallet/wallet-service';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Only registered brokers can recharge wallet' }, { status: 403 });
    }

    const body = await req.json();
    const { packId, customAmount, amount } = body;
    const effectiveCustom = customAmount !== undefined ? customAmount : amount;

    let targetAmount = 500;
    let selectedPack = RECHARGE_PACKS.find((p) => p.id === packId);

    if (selectedPack) {
      targetAmount = selectedPack.amountInInr;
    } else if (effectiveCustom && typeof effectiveCustom === 'number' && effectiveCustom >= 1) {
      targetAmount = Math.round(effectiveCustom);
      selectedPack = {
        id: 'pack_custom',
        name: `Custom Recharge (₹${targetAmount.toLocaleString('en-IN')})`,
        amountInInr: targetAmount,
        paidCredits: targetAmount,
        bonusCredits: 0,
        bonusExpiryDays: 0,
      };
    } else {
      selectedPack = RECHARGE_PACKS[0];
      targetAmount = selectedPack.amountInInr;
    }

    const wallet = getOrCreateWallet(user.id);
    const receipt = `rcpt_${user.id.slice(-6)}_${Date.now().toString().slice(-6)}`;

    const order = await createRazorpayOrder({
      amountInInr: targetAmount,
      receipt,
      notes: {
        brokerId: user.id,
        walletId: wallet.id,
        packId: selectedPack.id,
        brokerEmail: user.email,
        brokerPhone: user.phone,
      },
    });

    const nowIso = new Date().toISOString();
    saveRechargeOrder({
      orderId: order.orderId,
      brokerId: user.id,
      packId: selectedPack.id,
      amountInInr: targetAmount,
      paidCredits: selectedPack.paidCredits,
      bonusCredits: selectedPack.bonusCredits,
      bonusExpiryDays: selectedPack.bonusExpiryDays,
      isMock: order.isMock,
      status: 'created',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const { keyId } = getRazorpayCredentials();

    return NextResponse.json({
      success: true,
      order: {
        id: order.orderId,
        amount: order.amountInPaise,
        currency: order.currency,
        isMock: order.isMock,
      },
      orderId: order.orderId,
      amountInPaise: order.amountInPaise,
      amountInInr: targetAmount,
      currency: order.currency,
      pack: selectedPack,
      isMock: order.isMock,
      keyId,
      broker: {
        name: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create recharge order' }, { status: 500 });
  }
}

