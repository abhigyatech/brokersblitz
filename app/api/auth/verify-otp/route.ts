import { NextResponse } from 'next/server';
import { verifyOtp } from '../../../../lib/auth/otp-service';
import { findUserByEmail, findUserByPhone, createSession, createNewUser } from '../../../../lib/auth/user-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target, code, role, fullName } = body;

    if (!target || !code) {
      return NextResponse.json(
        { error: 'Target identifier and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const check = verifyOtp(target, code);
    if (!check.success) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const trimmed = target.trim();
    let user = findUserByEmail(trimmed);
    if (user && user.isLocked) {
      return NextResponse.json(
        { error: 'Account suspended: Your broker profile has been locked by the platform administrator. Contact operations@brokersblitz.in.' },
        { status: 403 }
      );
    }

    if (!user) {
      user = findUserByPhone(trimmed);
    }

    if (user && user.isLocked) {
      return NextResponse.json(
        { error: 'Account suspended: Your broker profile has been locked by the platform administrator. Contact operations@brokersblitz.in.' },
        { status: 403 }
      );
    }

    if (!user) {
      const isEmail = trimmed.includes('@');
      const newUserRes = createNewUser({
        fullName: fullName?.trim() || (isEmail ? trimmed.split('@')[0] : `User ${trimmed.slice(-4)}`),
        email: isEmail ? trimmed : `${trimmed}@brokersblitz.user`,
        phone: !isEmail ? trimmed : `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: role === 'broker' ? 'broker' : 'buyer',
        password: `OtpAuth_${Date.now()}_Secret!`,
        dpdpConsent: true,
      });

      if (!newUserRes.success || !newUserRes.user) {
        return NextResponse.json(
          { error: newUserRes.error || 'Failed to auto-provision account.' },
          { status: 400 }
        );
      }
      user = newUserRes.user;
    }

    const sessionToken = createSession(user.id);
    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      agencyName: user.agencyName,
      reraNumber: user.reraNumber,
      operatingCity: user.operatingCity,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Verified and logged in successfully.',
      user: safeUser,
    });

    response.cookies.set('bb_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Verification failed.' },
      { status: 500 }
    );
  }
}

