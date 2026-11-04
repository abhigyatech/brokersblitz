import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties, createProperty, searchProperties, saveProperties } from '@/lib/db/properties-store';
import { getSessionUser, getAllBrokers } from '@/lib/auth/user-store';
import {
  syncDailyListingDeductions,
  processListingOnCreation,
  interleaveAndPrioritizeListings,
} from '@/lib/listings/listing-lifecycle';

export async function GET(req: NextRequest) {
  try {
    await syncDailyListingDeductions().catch(() => {});

    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || undefined;
    const purpose = searchParams.get('purpose') || undefined;
    const category = searchParams.get('category') || undefined;
    const query = searchParams.get('q') || searchParams.get('query') || undefined;
    const bhk = searchParams.get('bhk') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const broker = searchParams.get('broker') || undefined;
    const reraOnly = searchParams.get('reraOnly') === 'true';

    let results = searchProperties({
      city,
      purpose,
      category,
      query,
      bhk,
      minPrice,
      maxPrice,
      reraOnly,
    });

    let isBrokerLocked = false;
    let brokerProfile: any = null;

    if (broker) {
      const bNorm = broker.toLowerCase().replace(/[^a-z0-9]/g, '');
      const allBrokers = getAllBrokers();
      const matched = allBrokers.find((b) => {
        const uCode = (b.agencyName || b.fullName).toLowerCase().replace(/[^a-z0-9]/g, '');
        return uCode === bNorm || b.id.toLowerCase() === bNorm;
      });
      if (matched) {
        isBrokerLocked = !!matched.isLocked;
        brokerProfile = {
          name: matched.fullName,
          agency: matched.agencyName,
          phone: matched.phone,
          email: matched.email,
          city: matched.operatingCity || 'India',
          reraNumber: matched.reraNumber || 'Self-Reported',
          isLocked: isBrokerLocked,
        };
      }

      results = results.filter((p) => {
        const storeCode = (p.broker.storeCode || p.broker.id).toLowerCase().replace(/[^a-z0-9]/g, '');
        const name = p.broker.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return storeCode === bNorm || name === bNorm;
      });
    }

    const prioritized = interleaveAndPrioritizeListings(results);

    return NextResponse.json({
      success: true,
      count: prioritized.length,
      properties: isBrokerLocked ? [] : prioritized,
      isBrokerLocked,
      brokerProfile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ success: false, error: 'Platform administrators manage the platform and do not publish property listings.' }, { status: 403 });
    }

    if (user.role !== 'broker') {
      return NextResponse.json({ success: false, error: 'Only registered brokers can publish properties.' }, { status: 403 });
    }

    if (user.isLocked) {
      return NextResponse.json({ success: false, error: 'Your broker profile has been locked by platform administration. You cannot publish listings.' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.title || !body.city || !body.price) {
      return NextResponse.json({ success: false, error: 'Missing required property details (title, city, price)' }, { status: 400 });
    }

    const created = createProperty(body, user);
    const finalized = await processListingOnCreation(created, user.id);

    const allProps = getAllProperties();
    const fIdx = allProps.findIndex((p) => p.id === finalized.id);
    if (fIdx >= 0) {
      allProps[fIdx] = finalized;
      saveProperties(allProps);
    }

    return NextResponse.json(
      {
        success: true,
        message: finalized.isFreeListing
          ? 'Property published successfully! Free for 15 days.'
          : finalized.status === 'active'
          ? 'Property published successfully with 2 daily active credits.'
          : 'Property created. Please add wallet credits to activate daily listing visibility.',
        property: finalized,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish property' },
      { status: 500 }
    );
  }
}

