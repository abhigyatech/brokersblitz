import { NextResponse } from 'next/server';
import { createNewUser, createSession } from '../../../../lib/auth/user-store';
import { validateReferralCode, processReferralReward } from '../../../../lib/referral/referral-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, role, password, agencyName, reraNumber, operatingCity, dpdpConsent, referralCode } = body;

    if (!fullName || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'Please fill in all mandatory fields.' },
        { status: 400 }
      );
    }

    if (role !== 'buyer' && role !== 'broker') {
      return NextResponse.json(
        { error: 'Invalid account category. Choose Buyer or Broker.' },
        { status: 400 }
      );
    }

    if (!dpdpConsent) {
      return NextResponse.json(
        { error: 'You must accept the DPDP Act compliance declaration and Terms of Service to continue.' },
        { status: 400 }
      );
    }

    if (role === 'broker' && (!reraNumber || !agencyName)) {
      return NextResponse.json(
        { error: 'Brokers must provide their government RERA registration number and agency name.' },
        { status: 400 }
      );
    }

    let validReferrerId: string | undefined;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim().length > 0) {
      const val = validateReferralCode(referralCode.trim());
      if (!val.valid) {
        return NextResponse.json(
          { error: val.error || 'Invalid referral code entered.' },
          { status: 400 }
        );
      }
      validReferrerId = val.referrer?.id;
    }

    const result = createNewUser({
      fullName,
      email,
      phone,
      role,
      password,
      agencyName,
      reraNumber,
      operatingCity,
      referredBy: validReferrerId,
      dpdpConsent: true,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Registration failed.' },
        { status: 400 }
      );
    }

    let referralResult: any = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim().length > 0) {
      referralResult = await processReferralReward(result.user.id, referralCode.trim());
    }

    const sessionToken = createSession(result.user.id);

    const safeUser = {
      id: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
      agencyName: result.user.agencyName,
      reraNumber: result.user.reraNumber,
      operatingCity: result.user.operatingCity,
      referralCode: result.user.referralCode,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account registered successfully.',
      user: safeUser,
      referral: referralResult?.success
        ? {
            applied: true,
            refereeCredits: referralResult.refereeCredits,
            referrerCredits: referralResult.referrerCredits,
            expiryDays: referralResult.expiryDays,
          }
        : undefined,
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
      { error: 'Internal server error while processing registration.' },
      { status: 500 }
    );
  }
}

