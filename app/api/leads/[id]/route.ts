import { NextRequest, NextResponse } from 'next/server';
import { updateLeadStatus } from '../../../../lib/db/leads-store';
import { getSessionUser } from '../../../../lib/auth/user-store';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const sessionToken = req.cookies.get('bb_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = getSessionUser(sessionToken);
    if (!user || (user.role !== 'broker' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized to update lead' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const updated = updateLeadStatus(id, body.status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Lead status updated to ${body.status}`,
      lead: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

