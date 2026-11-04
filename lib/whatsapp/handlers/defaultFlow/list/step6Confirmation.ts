import { sendButtonMessage, sendTextMessage } from '@/lib/whatsapp/meta-client';
import { setSessionStep, resetDraftListing, getOrCreateSession } from '@/lib/whatsapp/session-store';
import { DraftListingData } from '@/lib/whatsapp/types';
import { createProperty } from '@/lib/db/properties-store';
import { processListingOnCreation } from '@/lib/listings/listing-lifecycle';
import { StoredUser, findUserByPhone, findUserById, getAllUsers, saveUsers } from '@/lib/auth/user-store';
import { formatDraftSummaryCard } from '@/lib/whatsapp/voice-to-listing';
import { PropertyCategory, FurnishingStatus } from '@/data/types';

export async function promptListingConfirmation(
  from: string,
  draft: DraftListingData
): Promise<boolean> {
  setSessionStep(from, 'step6_confirm');
  const session = getOrCreateSession(from);
  const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);

  const brokerUser = (session.brokerId ? findUserById(session.brokerId) : null) || findUserByPhone(cleanPhone);

  const brokerInfo = brokerUser
    ? {
        name: brokerUser.fullName,
        agency: brokerUser.agencyName || 'BrokersBlitz Network',
        storeCode: brokerUser.storeCode,
        rera: brokerUser.reraNumber,
      }
    : session.brokerName
    ? {
        name: session.brokerName,
        agency: session.agencyName || 'BrokersBlitz Network',
        storeCode: session.brokerCode,
      }
    : undefined;

  const summary = formatDraftSummaryCard(draft, brokerInfo);

  return sendButtonMessage(from, summary, [
    { id: 'list_pub_yes', title: '✅ Publish Listing' },
    { id: 'draft_edit_menu', title: '✏️ Edit Details' },
    { id: 'list_pub_no', title: '❌ Discard Draft' },
  ]);
}

export async function executeListingPublish(
  from: string,
  draft: DraftListingData,
  userName?: string
): Promise<boolean> {
  const session = getOrCreateSession(from);
  const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);

  let brokerUser = (session.brokerId ? findUserById(session.brokerId) : null) || findUserByPhone(cleanPhone);

  if (!brokerUser) {
    const allUsers = getAllUsers();
    brokerUser = {
      id: `broker-wa-${cleanPhone}`,
      fullName: session.brokerName || userName || 'WhatsApp Partner Broker',
      email: `broker.${cleanPhone}@whatsapp.brokersblitz.in`,
      phone: cleanPhone,
      role: 'broker',
      passwordHash: 'whatsapp_verified',
      passwordSalt: 'salt',
      agencyName: session.agencyName || 'BrokersBlitz WhatsApp Network',
      storeCode: session.brokerCode || `wa-${cleanPhone}`,
      operatingCity: draft.city || 'Indore',
      dpdpConsent: true,
      dpdpConsentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allUsers.push(brokerUser);
    saveUsers(allUsers);
  }

  const categoryMapped: PropertyCategory =
    draft.category === 'villa'
      ? 'villa'
      : draft.category === 'plot' || draft.category === 'residential_plot'
      ? 'residential_plot'
      : draft.category === 'office' || draft.category === 'commercial_office'
      ? 'commercial_office'
      : draft.category === 'shop' || draft.category === 'retail_shop'
      ? 'retail_shop'
      : draft.category === 'warehouse' || draft.category === 'industrial_warehouse'
      ? 'industrial_warehouse'
      : 'apartment';

  const furnishingMapped: FurnishingStatus =
    draft.furnishing === 'furnished'
      ? 'fully_furnished'
      : draft.furnishing === 'unfurnished'
      ? 'unfurnished'
      : 'semi_furnished';

  const newProperty = createProperty(
    {
      title: draft.title || `${draft.bedrooms || 3} BHK Flat in ${draft.locality || 'Prime Area'}`,
      purpose: draft.purpose || 'sale',
      category: categoryMapped,
      categoryLabel: draft.categoryLabel || `${draft.bedrooms || 3} BHK Apartment`,
      price: draft.price || 5000000,
      carpetAreaSqft: draft.carpetAreaSqft || 1200,
      superBuiltupSqft: Math.round((draft.carpetAreaSqft || 1200) * 1.3),
      city: draft.city || brokerUser.operatingCity || 'Indore',
      locality: draft.locality || 'Prime Corridor',
      address: draft.address || `${draft.locality || 'Prime Corridor'}, ${draft.city || 'Indore'}`,
      floorInfo: draft.floorInfo || 'Mid Floor',
      furnishing: furnishingMapped,
      bedrooms: draft.bedrooms || 0,
      bathrooms: draft.bathrooms || 1,
      amenities: draft.amenities && draft.amenities.length > 0 ? draft.amenities : ['Lift', 'Covered Parking', '24/7 Security'],
      description: draft.description || `Direct verified listing by ${brokerUser.fullName} on BrokersBlitz WhatsApp Gateway.`,
    },
    brokerUser
  );

  const processed = await processListingOnCreation(newProperty, brokerUser.id);
  resetDraftListing(from);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://brokersblitz.in';
  const liveUrl = `${baseUrl}/property/${processed.slug}`;

  const quotaNotice = processed.isFreeListing
    ? 'Promotional Free Listing (First 5 free for 15 days rule active)'
    : 'Active Daily Billed Listing (2 credits/day)';

  const successMessage = `*LISTING PUBLISHED SUCCESSFULLY!* 🎉\n------------------------------\n• 🏠 *Title:* ${processed.title}\n• 👤 *Listed By:* ${brokerUser.fullName} (${brokerUser.agencyName || 'Partner Agency'})\n• 🌐 *Partner Store:* ${baseUrl}/broker/${brokerUser.storeCode || 'indore1001'}\n• 📊 *Status:* Active (${quotaNotice})\n• 🆔 *Property ID:* ${processed.id}\n\n*Live Web Link:*\n🔗 ${liveUrl}\n------------------------------\nYour property is now live and will be shared with verified buyers searching in ${processed.city}. Send another voice note anytime to list your next property! 🚀`;

  await sendTextMessage(from, successMessage);
  return true;
}
