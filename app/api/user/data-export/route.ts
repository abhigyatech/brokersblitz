import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '../../../../lib/auth/user-store';
import { generateDataPrincipalExport } from '../../../../lib/compliance/dpdp-service';

export async function GET() {
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

    const exportResult = generateDataPrincipalExport(user.id);
    if (!exportResult.success || !exportResult.data) {
      return NextResponse.json(
        { error: exportResult.error || 'Failed to export personal data' },
        { status: 500 }
      );
    }

    const response = new NextResponse(JSON.stringify(exportResult.data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="brokersblitz_privacy_export_${user.id}.json"`,
      },
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error processing data export' },
      { status: 500 }
    );
  }
}

