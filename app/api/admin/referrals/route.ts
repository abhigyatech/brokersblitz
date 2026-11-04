import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth/user-store';
import {
  getAdminReferralOverview,
  updateReferralConfig,
} from '../../../../lib/referral/referral-service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Administrator access required.' }, { status: 403 });
    }

    const data = getAdminReferralOverview();
    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json({ error: 'Internal server error fetching referral overview.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Administrator access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { referrerRewardCredits, refereeRewardCredits, expiryDays, isEnabled } = body;

    const updatedConfig = updateReferralConfig(
      {
        referrerRewardCredits,
        refereeRewardCredits,
        expiryDays,
        isEnabled,
      },
      user.email
    );

    return NextResponse.json({
      success: true,
      message: 'Referral program configuration updated successfully.',
      config: updatedConfig,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error updating referral config.' }, { status: 500 });
  }
}

