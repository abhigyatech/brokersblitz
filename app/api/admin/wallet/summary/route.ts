import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { verifySession, getAllBrokers } from '../../../../../lib/auth/user-store';
import { getAdminPlatformWalletSummary, syncWalletBalances, PromotionalGrant } from '../../../../../lib/wallet/wallet-service';

export async function GET(req: Request) {
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

    const summary = getAdminPlatformWalletSummary();
    const brokers = getAllBrokers();

    const grantsFile = path.join(process.cwd(), 'data', 'wallet_grants.json');
    let allGrants: PromotionalGrant[] = [];
    try {
      if (fs.existsSync(grantsFile)) {
        allGrants = JSON.parse(fs.readFileSync(grantsFile, 'utf-8'));
      }
    } catch {}

    const brokerWallets = brokers.map((b) => {
      const w = syncWalletBalances(b.id);
      const activeCount = allGrants.filter(
        (g) => g.brokerId === b.id && g.status === 'active' && g.remainingAmount > 0
      ).length;

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
    });

    return NextResponse.json({
      success: true,
      summary,
      brokerWallets,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch admin wallet summary' }, { status: 500 });
  }
}
