import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/user-store';
import { getPropertyById, updateProperty } from '@/lib/db/properties-store';
import { markListingAsSold, reactivateListing } from '@/lib/listings/listing-lifecycle';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = getSessionUser(sessionToken);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    const { id } = await context.params;
    const prop = getPropertyById(id);

    if (!prop) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && prop.broker.id !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized to manage this listing' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'sold') {
      const result = markListingAsSold(prop.id, prop.broker.id);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Listing marked as Sold Out. Daily charges paused.',
        property: result.property,
      });
    }

    if (action === 'reactivate') {
      const result = await reactivateListing(prop.id, prop.broker.id);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Listing reactivated successfully with 2 daily credits.',
        property: result.property,
      });
    }

    if (action === 'pause') {
      const updated = updateProperty(prop.id, { status: 'paused' });
      return NextResponse.json({
        success: true,
        message: 'Listing paused. Daily charges stopped.',
        property: updated,
      });
    }

    if (action === 'resume') {
      const isStillFree = prop.isFreeListing && prop.freeUntil && new Date(prop.freeUntil).getTime() > Date.now();
      if (isStillFree) {
        const updated = updateProperty(prop.id, { status: 'active', lastChargedAt: new Date().toISOString() });
        return NextResponse.json({
          success: true,
          message: 'Listing resumed as active (Promotional free period).',
          property: updated,
        });
      }

      const result = await reactivateListing(prop.id, prop.broker.id);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Listing resumed as active with 2 daily listing credits.',
        property: result.property,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Operation failed' }, { status: 500 });
  }
}

