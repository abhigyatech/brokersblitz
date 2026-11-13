import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/user-store';
import { getChatbotConfig, updateChatbotConfig } from '@/lib/settings/chatbot-settings-service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySession(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Administrator access required.' }, { status: 403 });
    }

    const config = await getChatbotConfig();
    return NextResponse.json({ success: true, config });
  } catch {
    return NextResponse.json({ error: 'Internal server error fetching chatbot settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySession(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Administrator access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { enabled, showAiAssistant, showWhatsApp, whatsappNumber } = body;

    const updatedConfig = await updateChatbotConfig(
      {
        enabled: typeof enabled === 'boolean' ? enabled : undefined,
        showAiAssistant: typeof showAiAssistant === 'boolean' ? showAiAssistant : undefined,
        showWhatsApp: typeof showWhatsApp === 'boolean' ? showWhatsApp : undefined,
        whatsappNumber: typeof whatsappNumber === 'string' ? whatsappNumber : undefined,
      },
      user.email
    );

    return NextResponse.json({
      success: true,
      message: 'Chatbot display controls updated successfully.',
      config: updatedConfig,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error updating chatbot settings.' }, { status: 500 });
  }
}
