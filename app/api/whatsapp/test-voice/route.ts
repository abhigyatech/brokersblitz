import { NextRequest, NextResponse } from 'next/server';
import {
  extractPropertyFromVoiceTranscript,
  formatDraftSummaryCard,
} from '@/lib/whatsapp/voice-to-listing';
import { executeListingPublish } from '@/lib/whatsapp/handlers/defaultFlow/list/step6Confirmation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transcript =
      body.transcript ||
      'Bhai scheme 78 me second floor pe 3BHK flat hai, 1500 sq ft, demand 75 lakh negotiable, lift aur car parking hai, urgent bechna hai.';
    const brokerPhone = body.phone || '9820144520';
    const brokerCity = body.city || 'Indore';
    const autoPublish = Boolean(body.publish);

    const extracted = await extractPropertyFromVoiceTranscript(transcript, brokerCity);
    const summaryCard = formatDraftSummaryCard(extracted);

    let publishedProperty: any = null;
    if (autoPublish) {
      await executeListingPublish(brokerPhone, extracted, body.userName || 'Test Partner Broker');
    }

    return NextResponse.json({
      success: true,
      transcript,
      extracted,
      summaryCard,
      published: autoPublish,
      publishedProperty,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process voice test' },
      { status: 500 }
    );
  }
}

