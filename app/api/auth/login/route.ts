import { NextResponse } from 'next/server';
import { findUserByEmail, findUserByPhone, createSession } from '../../../../lib/auth/user-store';
import { verifyPassword } from '../../../../lib/auth/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Please enter your registered email/mobile number and password.' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    let user = findUserByEmail(trimmed);
    if (!user) {
      user = findUserByPhone(trimmed);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email or mobile number. Please check and try again.' },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect password. Please verify and try again.' },
        { status: 401 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        { error: 'Account suspended: Your broker profile has been locked by the platform administrator. Please contact operations@brokersblitz.in.' },
        { status: 403 }
      );
    }

    if (user.role === 'admin' && !user.email.endsWith('@brokersblitz.in')) {
      return NextResponse.json(
        { error: 'Admin access denied: Non-corporate domain credentials.' },
        { status: 403 }
      );
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
      message: 'Logged in successfully.',
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
  } catch (err: any) {
    console.error('[Login Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while logging in.' },
      { status: 500 }
    );
  }
}

