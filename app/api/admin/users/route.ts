import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getAllBrokers, getAllBuyers, getPlatformUsersStats } from '@/lib/auth/user-store';
import { getAllProperties } from '@/lib/db/properties-store';
import { getAllLeads } from '@/lib/db/leads-store';
import { getSavedPropertyIds } from '@/lib/db/saved-store';
import { syncWalletBalances, getAdminPlatformWalletSummary } from '@/lib/wallet/wallet-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = getSessionUser(sessionToken);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Administrator clearance required' }, { status: 403 });
    }

    const allProps = getAllProperties();
    const allLeads = getAllLeads();
    const walletSummary = getAdminPlatformWalletSummary();

    const brokers = getAllBrokers().map((b) => {
      const storeCode = (b.agencyName || b.fullName).toLowerCase().replace(/[^a-z0-9]/g, '');
      const brokerListings = allProps.filter((p) => {
        const pCode = (p.broker.storeCode || p.broker.id).toLowerCase().replace(/[^a-z0-9]/g, '');
        return pCode === storeCode || p.broker.id === b.id;
      });
      const brokerLeads = allLeads.filter((l) => {
        const lCode = (l.brokerStoreCode || l.brokerId).toLowerCase().replace(/[^a-z0-9]/g, '');
        return lCode === storeCode || l.brokerId === b.id;
      });

      const w = syncWalletBalances(b.id);

      return {
        id: b.id,
        fullName: b.fullName,
        email: b.email,
        phone: b.phone,
        agencyName: b.agencyName || 'Independent Agency',
        reraNumber: b.reraNumber || 'Self-Reported',
        operatingCity: b.operatingCity || 'Pan India',
        isLocked: !!b.isLocked,
        createdAt: b.createdAt,
        listingsCount: brokerListings.length,
        leadsCount: brokerLeads.length,
        wallet: {
          totalBalance: w.paidBalance + w.freeBalance,
          paidBalance: w.paidBalance,
          freeBalance: w.freeBalance,
        },
      };
    });

    const buyers = getAllBuyers().map((u) => {
      const uPhone = u.phone.replace(/[^0-9]/g, '').slice(-10);
      const userLeads = allLeads.filter((l) => {
        const lPhone = l.buyerPhone ? l.buyerPhone.replace(/[^0-9]/g, '').slice(-10) : '';
        const lEmail = (l.buyerEmail || '').toLowerCase();
        return (uPhone && lPhone === uPhone) || (u.email && lEmail === u.email.toLowerCase());
      });
      const savedIds = getSavedPropertyIds(u.id);
      const w = syncWalletBalances(u.id);

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        isLocked: !!u.isLocked,
        dpdpConsent: u.dpdpConsent,
        enquiriesCount: userLeads.length,
        savedCount: savedIds.length,
        recentActivity: userLeads[0]
          ? `Enquired: ${userLeads[0].propertyTitle} (${new Date(userLeads[0].createdAt).toLocaleDateString()})`
          : 'Active on platform',
        wallet: {
          totalBalance: w.paidBalance + w.freeBalance,
          paidBalance: w.paidBalance,
          freeBalance: w.freeBalance,
        },
      };
    });

    const userStats = getPlatformUsersStats();

    return NextResponse.json({
      success: true,
      stats: {
        totalBrokers: userStats.totalBrokers,
        totalBuyers: userStats.totalBuyers,
        activeBrokers: userStats.activeBrokers,
        lockedBrokers: userStats.lockedBrokers,
        activeBuyers: userStats.activeBuyers,
        lockedBuyers: userStats.lockedBuyers,
        totalListings: allProps.length,
        activeListings: allProps.filter((p) => (p.status || 'active') === 'active').length,
        pausedListings: allProps.filter((p) => p.status === 'paused').length,
        expiredListings: allProps.filter((p) => p.status === 'expired').length,
        soldListings: allProps.filter((p) => p.status === 'sold').length,
        totalLeads: allLeads.length,
        totalPlatformCredits: walletSummary.totalCirculation,
        totalPaidCredits: walletSummary.totalPaidCirculation,
        totalFreeCredits: walletSummary.totalFreeCirculation,
        totalRechargesVolume: walletSummary.totalRechargesVolume,
        walletsCount: walletSummary.walletsCount,
      },
      brokers,
      buyers,
      listings: allProps,
      leads: allLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
