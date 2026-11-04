import { sendButtonMessage } from '@/lib/whatsapp/meta-client';
import { setSessionStep } from '@/lib/whatsapp/session-store';

export async function promptListingType(from: string): Promise<boolean> {
  setSessionStep(from, 'step1_intent');
  return sendButtonMessage(
    from,
    'What would you like to list today? 🏷️',
    [
      { id: 'list_intent_sell', title: '🏷️ For Sale' },
      { id: 'list_intent_rent', title: '🔑 For Rent' },
    ]
  );
}
