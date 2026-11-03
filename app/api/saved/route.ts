import { NextRequest, NextResponse } from 'next/server';
import { getSavedPropertyIds, toggleSavedProperty } from '../../../lib/db/saved-store';
import { getSessionUser } from '../../../lib/auth/user-store';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    const user = sessionToken ? getSessionUser(sessionToken) : null;
    const { searchParams } = new URL(req.url);
    const userId = user?.id || searchParams.get('userId') || 'guest-session';

    const savedIds = getSavedPropertyIds(userId);
    return NextResponse.json({ success: true, savedPropertyIds: savedIds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    const user = sessionToken ? getSessionUser(sessionToken) : null;
    const body = await req.json();

    const userId = user?.id || body.userId || 'guest-session';
    const propertyId = body.propertyId;

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 });
    }

    const result = toggleSavedProperty(userId, propertyId);
    return NextResponse.json({
      success: true,
      isSaved: result.isSaved,
      savedPropertyIds: result.propertyIds,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

