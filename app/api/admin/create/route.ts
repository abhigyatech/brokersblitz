import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, createAdminUser } from '../../../../lib/auth/user-store';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const currentAdmin = verifySession(token);
    if (!currentAdmin || currentAdmin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized administrators can create admin accounts.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, email, phone, password } = body;

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Please provide fullName, corporate @brokersblitz.in email, phone, and password.' },
        { status: 400 }
      );
    }

    const result = createAdminUser(currentAdmin.email, {
      fullName,
      email,
      phone,
      password,
    });

    if (!result.success || !result.user) {
      return NextResponse.json({ error: result.error || 'Failed to create admin.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'New platform administrator created successfully.',
      admin: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

