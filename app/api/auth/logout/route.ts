import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '../../../../lib/auth/user-store';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;

    if (token) {
      deleteSession(token);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    response.cookies.delete('bb_session');
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

