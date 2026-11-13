import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, getAllBrokers } from '../../../../../lib/auth/user-store';
import { getAdminPlatformWalletSummary, syncWalletBalances } from '../../../../../lib/wallet/wallet-service';
import { query } from '../../../../../lib/db/postgres';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifySession(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const [summary, brokers] = await Promise.all([
      getAdminPlatformWalletSummary(),
      getAllBrokers(),
    ]);

    const grantsRes = await query(
      `SELECT broker_id, count(*) as count
       FROM public.promotional_grants
       WHERE is_expired IS FALSE AND expires_at >= now() AND remaining_amount > 0
       GROUP BY broker_id`
    );

    const grantsCountMap = new Map<string, number>();
    for (const row of grantsRes.rows) {
      grantsCountMap.set(row.broker_id, parseInt(row.count, 10));
    }

    const brokerWallets = await Promise.all(
      brokers.map(async (b) => {
        const w = await syncWalletBalances(b.id);
        const activeCount = grantsCountMap.get(b.id) || 0;

        return {
          id: b.id,
          fullName: b.fullName,
          email: b.email,
          phone: b.phone,
          agencyName: b.agencyName,
          reraNumber: b.reraNumber,
          city: b.operatingCity || 'Pan India',
          paidBalance: w.paidBalance,
          freeBalance: w.freeBalance,
          totalBalance: w.paidBalance + w.freeBalance,
          activeGrantsCount: activeCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      summary,
      brokerWallets,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch admin wallet summary' }, { status: 500 });
  }
}
