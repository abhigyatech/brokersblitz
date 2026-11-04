import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth/user-store';
import { getWalletStatement } from '../../../../lib/wallet/wallet-service';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetBrokerId =
      user.role === 'admin' && searchParams.get('brokerId') ? searchParams.get('brokerId')! : user.id;

    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const statement = getWalletStatement(targetBrokerId, { type, search, limit });

    return NextResponse.json({
      success: true,
      statement: {
        brokerId: targetBrokerId,
        brokerName: user.fullName,
        openingBalance: statement.wallet.totalBalance,
        closingBalance: statement.wallet.totalBalance,
        paidBalance: statement.wallet.paidBalance,
        freeBalance: statement.wallet.freeBalance,
        totalCredits: statement.wallet.totalBalance,
        activePromotionalGrants: statement.grants,
        nearestExpiringGrant: statement.nearestExpiry
          ? {
              id: 'exp_nearest',
              amount: statement.nearestExpiry.amount,
              remainingAmount: statement.nearestExpiry.amount,
              grantedAt: '',
              expiresAt: statement.nearestExpiry.expiresAt,
              reason: 'Expiring Promotion',
            }
          : null,
        generatedAt: new Date().toISOString(),
        transactions: statement.transactions,
      },
      ...statement,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch statement' }, { status: 500 });
  }
}
