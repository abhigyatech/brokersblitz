import { sendButtonMessage, sendListMessage } from '@/lib/whatsapp/meta-client';
import { setSessionStep } from '@/lib/whatsapp/session-store';

export async function promptSubCategory(from: string, isResidential: boolean): Promise<boolean> {
  setSessionStep(from, 'step3_specs');

  if (isResidential) {
    return sendListMessage(
      from,
      'Select Sub-Category 📋',
      'Choose the type of residential property you are listing: 🏠',
      'Select Type 📋',
      [
        {
          title: 'Residential Types',
          rows: [
            { id: 'sub_flat', title: 'Flat / Apartment', description: '🏢 Gated society or standalone flat' },
            { id: 'sub_villa', title: 'Villa / House', description: '🏡 Independent bungalow or house' },
            { id: 'sub_plot', title: 'Residential Plot', description: '📐 Residential land parcel' },
          ],
        },
      ]
    );
  }

  return sendListMessage(
    from,
    'Select Commercial Type 🏢',
    'Choose the commercial property category: 💼',
    'Select Type 📋',
    [
      {
        title: 'Commercial Types',
        rows: [
          { id: 'sub_office', title: 'Commercial Office', description: '🏢 IT park or business hub space' },
          { id: 'sub_shop', title: 'Retail Shop', description: '🛍️ High-street showroom or shop' },
          { id: 'sub_warehouse', title: 'Warehouse / Godown', description: '🏭 Industrial shed or logistics' },
        ],
      },
    ]
  );
}

export async function promptBhkConfiguration(from: string): Promise<boolean> {
  return sendButtonMessage(
    from,
    'Select BHK configuration for this residential property: 🛋️',
    [
      { id: 'bhk_1', title: '1 BHK 🚪' },
      { id: 'bhk_2', title: '2 BHK 🚪' },
      { id: 'bhk_3', title: '3 BHK 🚪' },
    ]
  );
}
