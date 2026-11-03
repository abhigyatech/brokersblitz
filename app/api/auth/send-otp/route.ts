import { NextResponse } from 'next/server';
import { sendOtp } from '../../../../lib/auth/otp-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target, type } = body;

    if (!target || !type || (type !== 'email' && type !== 'whatsapp')) {
      return NextResponse.json(
        { error: 'Please provide a valid target (email or mobile) and type (email or whatsapp).' },
        { status: 400 }
      );
    }

    const result = await sendOtp(target, type);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to dispatch verification code.' },
      { status: 500 }
    );
  }
}

