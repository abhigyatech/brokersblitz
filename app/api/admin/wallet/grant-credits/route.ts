import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, findUserById } from '../../../../../lib/auth/user-store';
import { grantFreeCredits } from '../../../../../lib/wallet/wallet-service';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = verifySession(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { brokerId, amount, expiryDays, reason } = body;

    if (!brokerId || typeof brokerId !== 'string') {
      return NextResponse.json({ success: false, error: 'Target broker ID is required' }, { status: 400 });
    }

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number' }, { status: 400 });
    }

    const parsedExpiryDays = parseInt(expiryDays, 10);
    if (isNaN(parsedExpiryDays) || parsedExpiryDays <= 0 || parsedExpiryDays > 365) {
      return NextResponse.json({ success: false, error: 'Expiry days must be between 1 and 365 days' }, { status: 400 });
    }

    const targetUser = findUserById(brokerId);
    if (!targetUser || targetUser.role !== 'broker') {
      return NextResponse.json({ success: false, error: 'Target user is not a verified broker' }, { status: 404 });
    }

    const result = await grantFreeCredits(
      brokerId,
      parsedAmount,
      parsedExpiryDays,
      reason || 'Admin Goodwill Promotion',
      admin.id,
      admin.fullName
    );

    return NextResponse.json({
      success: true,
      message: `Successfully credited ${parsedAmount} free promotional credits to ${targetUser.fullName} (Valid for ${parsedExpiryDays} days).`,
      wallet: result.wallet,
      transaction: result.transaction,
      grant: result.grant,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to grant free credits' }, { status: 500 });
  }
}
