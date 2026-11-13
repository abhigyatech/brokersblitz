import { promptListingType } from './step1ListingType';
import { promptCategory } from './step2Category';
import { promptSubCategory, promptBhkConfiguration } from './step3Details';
import { promptCitySelection, promptLocalityName } from './step4Location';
import { promptPrice, parsePriceInput } from './step5Price';
import { promptListingConfirmation, executeListingPublish } from './step6Confirmation';
import {
  getOrCreateSession,
  updateDraftListing,
  resetDraftListing,
} from '@/lib/whatsapp/session-store';
import { sendTextMessage } from '@/lib/whatsapp/meta-client';
import { IncomingWhatsAppMessage } from '@/lib/whatsapp/types';
import { matchIndianCity } from '@/lib/geo/indian-locations';

export async function handleListingFlow(msg: IncomingWhatsAppMessage): Promise<boolean> {
  const from = msg.from;
  const session = await getOrCreateSession(from, msg.userName);
  const actionId = msg.interactiveButtonId || msg.interactiveListId || '';

  if (actionId === 'broker_action_list' || (msg.text && /^list(\s+property)?$/i.test(msg.text.trim()))) {
    await resetDraftListing(from);
    await promptListingType(from);
    return true;
  }

  if (actionId === 'list_intent_sell' || actionId === 'list_intent_rent') {
    const purpose = actionId === 'list_intent_rent' ? 'rent' : 'sale';
    await updateDraftListing(from, { purpose });
    await promptCategory(from);
    return true;
  }

  if (actionId === 'list_cat_res' || actionId === 'list_cat_comm') {
    const isRes = actionId === 'list_cat_res';
    await updateDraftListing(from, { category: isRes ? 'residential' : 'commercial' });
    await promptSubCategory(from, isRes);
    return true;
  }

  if (actionId.startsWith('sub_')) {
    const subType = actionId.replace('sub_', '');
    if (subType === 'flat') {
      await updateDraftListing(from, { category: 'apartment', categoryLabel: 'Flat / Apartment' });
      await promptBhkConfiguration(from);
      return true;
    } else if (subType === 'villa') {
      await updateDraftListing(from, { category: 'villa', categoryLabel: 'Villa / House' });
      await promptBhkConfiguration(from);
      return true;
    } else if (subType === 'plot') {
      await updateDraftListing(from, { category: 'plot', categoryLabel: 'Residential Plot', bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    } else if (subType === 'office') {
      await updateDraftListing(from, { category: 'commercial', categoryLabel: 'Commercial Office', bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    } else if (subType === 'shop') {
      await updateDraftListing(from, { category: 'commercial', categoryLabel: 'Retail Shop', bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    } else if (subType === 'warehouse') {
      await updateDraftListing(from, { category: 'commercial', categoryLabel: 'Warehouse', bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    }
  }

  if (actionId.startsWith('bhk_')) {
    const count = parseInt(actionId.replace('bhk_', ''), 10) || 2;
    const existingDraft = session.draftListing || {};
    const categoryLabel = `${count} BHK ${existingDraft.category === 'villa' ? 'Villa' : 'Apartment'}`;
    const carpetAreaSqft = count === 1 ? 650 : count === 2 ? 1050 : count === 3 ? 1500 : 2200;

    await updateDraftListing(from, {
      bedrooms: count,
      bathrooms: Math.max(1, count),
      categoryLabel,
      carpetAreaSqft,
    });

    await promptCitySelection(from);
    return true;
  }

  if (actionId.startsWith('city_')) {
    const cityName = actionId.replace('city_', '').replace(/\b\w/g, (l) => l.toUpperCase());
    await updateDraftListing(from, { city: cityName });
    await promptLocalityName(from, cityName);
    return true;
  }

  if (session.currentStep === 'step4_city' && msg.text) {
    const matched = matchIndianCity(msg.text);
    const cityName = matched ? matched.city : msg.text.trim();
    await updateDraftListing(from, { city: cityName });
    await promptLocalityName(from, cityName);
    return true;
  }

  if (session.currentStep === 'step4_locality' && msg.text) {
    const locality = msg.text.trim();
    const updated = await updateDraftListing(from, {
      locality,
      address: `${locality}, ${session.draftListing?.city || 'Indore'}`,
    });
    const draft = updated.draftListing;

    const isRent = draft?.purpose === 'rent';
    await promptPrice(from, isRent);
    return true;
  }

  if (session.currentStep === 'step5_price' && msg.text) {
    const isRent = session.draftListing?.purpose === 'rent';
    const price = parsePriceInput(msg.text, isRent);
    const updated = await updateDraftListing(from, { price });
    const draft = updated.draftListing;

    if (draft) {
      await promptListingConfirmation(from, draft);
    }
    return true;
  }

  if (actionId === 'list_pub_yes') {
    if (session.draftListing) {
      await executeListingPublish(from, session.draftListing, msg.userName);
    } else {
      await sendTextMessage(from, 'No active listing draft found. Send "LIST" or send an audio voice note to start.');
    }
    return true;
  }

  if (actionId === 'list_pub_no') {
    await resetDraftListing(from);
    await sendTextMessage(from, 'Listing draft cancelled. Send "LIST" or a voice note whenever you are ready.');
    return true;
  }

  return false;
}
