import { NextResponse } from 'next/server';
import { getChatbotConfig } from '@/lib/settings/chatbot-settings-service';

export async function GET() {
  try {
    const config = await getChatbotConfig();
    return NextResponse.json({
      success: true,
      config: {
        enabled: config.enabled,
        showAiAssistant: config.showAiAssistant,
        showWhatsApp: config.showWhatsApp,
        whatsappNumber: config.whatsappNumber,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: true,
        config: {
          enabled: true,
          showAiAssistant: true,
          showWhatsApp: true,
          whatsappNumber: '+91 72723 57771',
        },
      },
      { status: 200 }
    );
  }
}
