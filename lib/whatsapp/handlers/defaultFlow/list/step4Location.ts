import { sendListMessage, sendTextMessage } from '@/lib/whatsapp/meta-client';
import { setSessionStep } from '@/lib/whatsapp/session-store';

export async function promptCitySelection(from: string): Promise<boolean> {
  setSessionStep(from, 'step4_city');

  return sendListMessage(
    from,
    'Select City 📍',
    'Choose the operating city of this property: 🏙️',
    'Select City 📍',
    [
      {
        title: 'Central & West India',
        rows: [
          { id: 'city_indore', title: 'Indore', description: '📍 Madhya Pradesh' },
          { id: 'city_bhopal', title: 'Bhopal', description: '📍 Madhya Pradesh' },
          { id: 'city_mumbai', title: 'Mumbai', description: '📍 Maharashtra' },
          { id: 'city_pune', title: 'Pune', description: '📍 Maharashtra' },
          { id: 'city_ahmedabad', title: 'Ahmedabad', description: '📍 Gujarat' },
        ],
      },
      {
        title: 'North & South Metros',
        rows: [
          { id: 'city_delhi', title: 'Delhi NCR', description: '📍 Gurgaon, Noida, Delhi' },
          { id: 'city_bangalore', title: 'Bangalore', description: '📍 Karnataka' },
          { id: 'city_hyderabad', title: 'Hyderabad', description: '📍 Telangana' },
          { id: 'city_jaipur', title: 'Jaipur', description: '📍 Rajasthan' },
        ],
      },
    ]
  );
}

export async function promptLocalityName(from: string, selectedCity: string): Promise<boolean> {
  setSessionStep(from, 'step4_locality');
  return sendTextMessage(
    from,
    `Great! Selected city is *${selectedCity}* 📍.\n\nPlease type the exact locality, colony or landmark name (e.g., "Vijay Nagar, Sector 78" or "Bandra West near Linking Road"): 🗺️`
  );
}
