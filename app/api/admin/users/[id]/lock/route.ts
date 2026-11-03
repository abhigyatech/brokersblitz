import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, toggleUserLock } from '@/lib/auth/user-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSessionUser(sessionToken);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const res = toggleUserLock(id);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${res.user?.fullName} has been marked as ${res.user?.isLocked ? 'Inactive (Suspended)' : 'Active'}.`,
      user: {
        id: res.user?.id,
        fullName: res.user?.fullName,
        isLocked: res.user?.isLocked,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

