import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, deleteSession } from '../../../../lib/auth/user-store';
import { executeDataPrincipalErasure } from '../../../../lib/compliance/dpdp-service';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = verifySession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmPhrase } = body;

    if (!confirmPhrase || confirmPhrase.trim() !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Confirmation phrase mismatch. Please type "DELETE MY ACCOUNT" exactly.' },
        { status: 400 }
      );
    }

    const erasureRes = executeDataPrincipalErasure(user.id);
    if (!erasureRes.success) {
      return NextResponse.json(
        { error: erasureRes.error || 'Failed to erase personal data.' },
        { status: 500 }
      );
    }

    deleteSession(token);

    const response = NextResponse.json({
      success: true,
      message: 'Your personal data and account have been permanently erased in compliance with Section 12 of the DPDP Act 2023.',
    });

    response.cookies.delete('bb_session');

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error processing account erasure.' },
      { status: 500 }
    );
  }
}

