import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth/user-store';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        agencyName: user.agencyName,
        storeCode: user.storeCode,
        referralCode: user.referralCode,
        reraNumber: user.reraNumber,
        operatingCity: user.operatingCity,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

