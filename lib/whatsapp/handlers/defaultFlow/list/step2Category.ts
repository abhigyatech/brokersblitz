import { sendButtonMessage } from '@/lib/whatsapp/meta-client';
import { setSessionStep } from '@/lib/whatsapp/session-store';

export async function promptCategory(from: string): Promise<boolean> {
  setSessionStep(from, 'step2_category');
  return sendButtonMessage(
    from,
    'Select property category: 🏢',
    [
      { id: 'list_cat_res', title: '🏠 Residential' },
      { id: 'list_cat_comm', title: '🏢 Commercial' },
    ]
  );
}
