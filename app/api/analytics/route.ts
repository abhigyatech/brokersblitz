import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties } from '@/lib/db/properties-store';
import { getAllLeads, getLeadsByBroker } from '@/lib/db/leads-store';
import { getSessionUser } from '@/lib/auth/user-store';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    const user = sessionToken ? getSessionUser(sessionToken) : null;

    const properties = getAllProperties();
    const leads = getAllLeads();

    let brokerProperties = properties;
    let brokerLeads = leads;

    if (user && user.role !== 'admin') {
      const brokerNorm = (user.agencyName || user.fullName).toLowerCase().replace(/[^a-z0-9]/g, '');
      brokerProperties = properties.filter((p) => {
        const code = (p.broker.storeCode || p.broker.id).toLowerCase().replace(/[^a-z0-9]/g, '');
        const name = p.broker.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return code === brokerNorm || name === brokerNorm;
      });
      brokerLeads = getLeadsByBroker(brokerNorm);
    }

    const activeListings = brokerProperties.filter((p) => p.status !== 'paused' && p.status !== 'sold');
    const totalViews = brokerProperties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const pendingVisits = brokerLeads.filter((l) => l.status === 'new' || l.status === 'rescheduled');

    return NextResponse.json({
      success: true,
      stats: {
        totalListings: brokerProperties.length,
        activeListingsCount: activeListings.length,
        botInquiriesLogged: brokerLeads.length,
        totalViewsCount: totalViews,
        pendingVisitsCount: pendingVisits.length,
        recentInquiries: brokerLeads.slice(0, 5),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

