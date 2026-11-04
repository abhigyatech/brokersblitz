import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth/user-store';
import { getUserReferralInfo } from '../../../../lib/referral/referral-service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }

    const info = getUserReferralInfo(user.id);
    return NextResponse.json({ success: true, ...info });
  } catch {
    return NextResponse.json({ error: 'Internal server error fetching referral info.' }, { status: 500 });
  }
}

