import { sendTextMessage, sendButtonMessage, sendListMessage } from '@/lib/whatsapp/meta-client';
import { searchProperties, getAllProperties } from '@/lib/db/properties-store';
import { createLead } from '@/lib/db/leads-store';
import { formatPriceIndian } from '@/lib/whatsapp/voice-to-listing';
import {
  getOrCreateSession,
  setSessionStep,
  updateBuyerPreferences,
  resetBuyerPreferences,
} from '@/lib/whatsapp/session-store';
import {
  POPULAR_INDIAN_STATES,
  findStateByNameOrCode,
  getCitiesForState,
  matchIndianCity,
} from '@/lib/geo/indian-locations';

function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  return 'https://brokersblitz.in';
}

export async function promptBuyerIntent(from: string, userName?: string): Promise<boolean> {
  resetBuyerPreferences(from);
  setSessionStep(from, 'buyer_step1_intent');

  const greeting = `Namaste ${userName || 'there'}! Welcome to *BrokersBlitz* 🇮🇳 - India's direct broker-verified real estate intelligence network.\n\nWhat are you looking for today?`;

  return sendButtonMessage(from, greeting, [
    { id: 'buyer_intent_buy', title: '🏠 Buy Property' },
    { id: 'buyer_intent_rent', title: '🔑 Rent Property' },
    { id: 'buyer_action_broker', title: '💼 Broker Access' },
  ]);
}

export async function promptBuyerState(from: string, isRent: boolean): Promise<boolean> {
  setSessionStep(from, 'buyer_step2_state');

  const rows = POPULAR_INDIAN_STATES.slice(0, 9).map((s) => ({
    id: `buyer_state_${s.code.toLowerCase()}`,
    title: s.name,
    description: `📍 ${s.popularCities.slice(0, 3).join(', ')}`,
  }));

  rows.push({
    id: 'buyer_state_other',
    title: '🌐 Other States / UTs',
    description: 'Type any Indian State or City name directly',
  });

  return sendListMessage(
    from,
    'Step 1 of 5: Select State 📍',
    `Select the State or Territory where you are looking to ${isRent ? 'rent' : 'buy'} property.\n\n_Or reply directly with any City name (e.g. "Indore", "Lucknow", "Goa", "Pune")_:`,
    'Select State 📍',
    [
      {
        title: 'Major Real Estate Hubs 🇮🇳',
        rows,
      },
    ]
  );
}

export async function promptBuyerCityForState(
  from: string,
  stateName: string,
  stateCode: string,
  isRent: boolean
): Promise<boolean> {
  setSessionStep(from, 'buyer_step2_city');

  const cities = getCitiesForState(stateCode);
  const rows = cities.slice(0, 9).map((c) => ({
    id: `buyer_city_${c.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    title: c,
    description: `📍 ${stateName}`,
  }));

  rows.push({
    id: 'buyer_city_custom',
    title: '✏️ Type Another City',
    description: `Reply with any locality or town in ${stateName}`,
  });

  return sendListMessage(
    from,
    'Step 2 of 5: Select City 🏙️',
    `Which city in *${stateName}* are you targeting for ${isRent ? 'rent' : 'purchase'}?`,
    'Select City 🏙️',
    [
      {
        title: `${stateName} Cities 📍`,
        rows,
      },
    ]
  );
}

export async function promptBuyerLocality(from: string, cityName: string): Promise<boolean> {
  setSessionStep(from, 'buyer_step2_locality');

  const text = `*Step 3 of 5: Locality / Area in ${cityName}* 📍\n\nDo you have a specific neighborhood, sector, or colony in mind?\n\n• Tap *Any Locality* to browse all areas\n• Or reply with your preferred area (e.g. _"Vijay Nagar"_, _"Bandra"_, _"Whitefield"_, _"Sector 78"_):`;

  return sendButtonMessage(from, text, [
    { id: 'buyer_loc_any', title: '🌐 Any Locality' },
    { id: 'buyer_cat_flat', title: '🏢 Proceed with Flats' },
  ]);
}

export async function promptBuyerCategory(from: string, city: string): Promise<boolean> {
  setSessionStep(from, 'buyer_step3_category');

  return sendButtonMessage(
    from,
    `*Step 3 of 5: Property Type in ${city}* 🏢\nWhat type of property are you looking for?`,
    [
      { id: 'buyer_cat_flat', title: '🏢 Flat / Apartment' },
      { id: 'buyer_cat_villa', title: '🏡 Villa / House' },
      { id: 'buyer_cat_plot', title: '📐 Plot / Land' },
    ]
  );
}

export async function promptBuyerBhk(from: string, categoryLabel: string, city: string): Promise<boolean> {
  setSessionStep(from, 'buyer_step4_bhk');

  return sendButtonMessage(
    from,
    `*Step 4 of 5: Configuration* 🛋️\nSelect BHK requirement for your ${categoryLabel} in ${city}:`,
    [
      { id: 'buyer_bhk_1', title: '1 BHK 🚪' },
      { id: 'buyer_bhk_2', title: '2 BHK 🚪' },
      { id: 'buyer_bhk_3', title: '3 BHK 🚪' },
    ]
  );
}

export async function promptBuyerBudget(
  from: string,
  isRent: boolean,
  summarySpecs: string
): Promise<boolean> {
  setSessionStep(from, 'buyer_step5_budget');

  if (isRent) {
    return sendButtonMessage(
      from,
      `*Step 5 of 5: Monthly Rent Budget* 💰\nSelect your expected monthly rent range for ${summarySpecs}:`,
      [
        { id: 'buyer_rent_15k', title: 'Under ₹15,000' },
        { id: 'buyer_rent_30k', title: '₹15k - ₹30,000' },
        { id: 'buyer_rent_above', title: 'Above ₹30,000' },
      ]
    );
  }

  return sendButtonMessage(
    from,
    `*Step 5 of 5: Purchase Budget* 💰\nSelect your preferred investment budget for ${summarySpecs}:`,
    [
      { id: 'buyer_budget_50l', title: '💰 Under ₹50 Lakhs' },
      { id: 'buyer_budget_1cr', title: '💰 ₹50L - ₹1 Crore' },
      { id: 'buyer_budget_above', title: '💰 Above ₹1 Crore' },
    ]
  );
}

export async function executeBuyerSearch(from: string): Promise<boolean> {
  const session = getOrCreateSession(from);
  const prefs = session.buyerPreferences || {};
  setSessionStep(from, 'idle');

  const city = prefs.city || 'Indore';
  const bhk = prefs.bedrooms ? String(prefs.bedrooms) : undefined;
  const category = prefs.category === 'apartment' ? 'apartment' : prefs.category === 'villa' ? 'villa' : undefined;
  const purpose = prefs.purpose || 'sale';

  const results = searchProperties({
    city,
    bhk,
    category,
    purpose,
    minPrice: prefs.minPrice,
    maxPrice: prefs.maxPrice,
  });

  const baseUrl = getAppBaseUrl();

  if (results.length > 0) {
    const topMatches = results.slice(0, 3);
    const bhkLabel = prefs.bedrooms ? `${prefs.bedrooms} BHK ` : '';
    const budgetLabel = prefs.budgetLabel ? ` | Budget: ${prefs.budgetLabel}` : '';
    const localityLabel = prefs.locality ? ` in ${prefs.locality}` : '';

    let response = `*FOUND ${results.length} VERIFIED PROPERTIES IN ${city.toUpperCase()}!* 🎯\nCriteria: ${bhkLabel}${prefs.categoryLabel || 'Residential'}${localityLabel}${budgetLabel}\n\n`;

    topMatches.forEach((p, idx) => {
      const price = formatPriceIndian(p.price);
      response += `${idx + 1}. 🏠 *${p.title}*\n`;
      response += `   • 💰 *Price:* ${price}\n`;
      response += `   • 📐 *Area:* ${p.carpetAreaSqft} sq.ft (${p.categoryLabel})\n`;
      response += `   • 📍 *Location:* ${p.locality}, ${p.city}\n`;
      response += `   • 👤 *Broker:* ${p.broker.name} (${p.broker.agency})\n`;
      response += `   • 🔗 *View Details:* ${baseUrl}/property/${p.slug}\n\n`;
    });

    response += `Would you like to schedule a private viewing or modify your filters?`;

    return sendButtonMessage(from, response, [
      { id: 'buyer_action_visit', title: '📅 Book Site Visit' },
      { id: 'buyer_action_restart', title: '🔄 Modify Search' },
      { id: 'buyer_action_broker', title: '💼 Broker Access' },
    ]);
  }

  const fallbackResults = searchProperties({ city, purpose });
  const closest = fallbackResults.slice(0, 2);

  let noMatchMsg = `*NO EXACT MATCHES IN THAT BUDGET RANGE* 🔍\nWe currently don't have active listings matching all specific filters in ${city}.\n\n`;

  if (closest.length > 0) {
    noMatchMsg += `*Closest Verified Options in ${city}:* 🏙️\n\n`;
    closest.forEach((p, idx) => {
      noMatchMsg += `${idx + 1}. 🏠 *${p.title}*\n   • 💰 *Price:* ${formatPriceIndian(p.price)}\n   • 📍 *Location:* ${p.locality}\n   • 🔗 *Link:* ${baseUrl}/property/${p.slug}\n\n`;
    });
  }

  noMatchMsg += `Would you like to adjust your budget or search another city?`;

  return sendButtonMessage(from, noMatchMsg, [
    { id: 'buyer_action_restart', title: '🔄 Start New Search' },
    { id: 'buyer_action_visit', title: '📅 Book Site Visit' },
    { id: 'buyer_action_broker', title: '💼 Broker Access' },
  ]);
}

export async function handleBuyerInquiry(
  from: string,
  text: string,
  userName?: string,
  actionId?: string
): Promise<boolean> {
  const session = getOrCreateSession(from, userName);
  const cleanPhone = from.replace(/[^0-9]/g, '').slice(-10);
  const rawInput = text.trim();

  const isGreetingOrReset =
    actionId === 'buyer_action_restart' ||
    actionId === 'buyer_action_search' ||
    new RegExp('^(hi+|hello+|hey+|namaste+|pranam+|hola+|start+|menu+|search+|restart+|reset+|help+|options?)[!.\\s]*$', 'i').test(rawInput) ||
    new RegExp('^(good\\s+(morning|afternoon|evening))[!.\\s]*$', 'i').test(rawInput);

  if (isGreetingOrReset) {
    return promptBuyerIntent(from, userName);
  }

  if (actionId === 'buyer_intent_buy' || actionId === 'buyer_intent_rent') {
    const isRent = actionId === 'buyer_intent_rent';
    updateBuyerPreferences(from, { purpose: isRent ? 'rent' : 'sale' });
    return promptBuyerState(from, isRent);
  }

  if (actionId?.startsWith('buyer_state_') || session.currentStep === 'buyer_step2_state') {
    const isRent = session.buyerPreferences?.purpose === 'rent';

    if (actionId === 'buyer_state_other') {
      await sendTextMessage(
        from,
        `📍 *ENTER YOUR STATE OR CITY*\n\nPlease reply with the name of any Indian State, Union Territory, or City (e.g. "Goa", "Chandigarh", "Uttarakhand", "Kerala", "Lucknow", "Surat"):`
      );
      return true;
    }

    let stateCode = '';
    let stateName = '';

    if (actionId?.startsWith('buyer_state_')) {
      const code = actionId.replace('buyer_state_', '').toUpperCase();
      const st = POPULAR_INDIAN_STATES.find((s) => s.code === code) || findStateByNameOrCode(code);
      if (st) {
        stateCode = st.code;
        stateName = st.name;
      }
    } else if (rawInput) {
      const directCity = matchIndianCity(rawInput);
      if (directCity) {
        updateBuyerPreferences(from, { city: directCity.city, state: directCity.state });
        return promptBuyerLocality(from, directCity.city);
      }

      const st = findStateByNameOrCode(rawInput);
      if (st) {
        stateCode = st.code;
        stateName = st.name;
      }
    }

    if (stateCode && stateName) {
      updateBuyerPreferences(from, { state: stateName, stateCode });
      return promptBuyerCityForState(from, stateName, stateCode, isRent);
    }

    const fallbackCity = matchIndianCity(rawInput) || { city: 'Indore', state: 'Madhya Pradesh' };
    updateBuyerPreferences(from, { city: fallbackCity.city, state: fallbackCity.state });
    return promptBuyerLocality(from, fallbackCity.city);
  }

  if (actionId?.startsWith('buyer_city_') || session.currentStep === 'buyer_step2_city') {
    const isRent = session.buyerPreferences?.purpose === 'rent';

    if (actionId === 'buyer_city_custom') {
      await sendTextMessage(
        from,
        `🏙️ *ENTER CITY / DISTRICT NAME*\n\nPlease type the exact city or town name where you are looking for property:`
      );
      return true;
    }

    let cityName = '';
    if (actionId?.startsWith('buyer_city_')) {
      const rawSlug = actionId.replace('buyer_city_', '');
      cityName = rawSlug
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    } else if (rawInput) {
      const matched = matchIndianCity(rawInput);
      cityName = matched ? matched.city : rawInput.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    cityName = cityName || 'Indore';
    updateBuyerPreferences(from, { city: cityName });
    return promptBuyerLocality(from, cityName);
  }

  if (
    actionId === 'buyer_loc_any' ||
    session.currentStep === 'buyer_step2_locality'
  ) {
    const prefs = session.buyerPreferences || {};
    const city = prefs.city || 'Indore';
    let locality: string | undefined = undefined;

    if (actionId !== 'buyer_loc_any' && rawInput && !new RegExp('^(any|all|no|none|skip)$', 'i').test(rawInput)) {
      locality = rawInput.trim();
    }

    updateBuyerPreferences(from, { locality });
    return promptBuyerCategory(from, city);
  }

  if (actionId?.startsWith('buyer_cat_') || session.currentStep === 'buyer_step3_category') {
    const catId = actionId || '';
    const prefs = session.buyerPreferences || {};
    const city = prefs.city || 'Indore';

    if (catId === 'buyer_cat_flat' || rawInput.toLowerCase().includes('flat') || rawInput.toLowerCase().includes('apartment')) {
      updateBuyerPreferences(from, { category: 'apartment', categoryLabel: 'Flat / Apartment' });
      return promptBuyerBhk(from, 'Flat / Apartment', city);
    } else if (catId === 'buyer_cat_villa' || rawInput.toLowerCase().includes('villa') || rawInput.toLowerCase().includes('house')) {
      updateBuyerPreferences(from, { category: 'villa', categoryLabel: 'Villa / House' });
      return promptBuyerBhk(from, 'Villa / House', city);
    } else if (catId === 'buyer_cat_plot' || rawInput.toLowerCase().includes('plot') || rawInput.toLowerCase().includes('land')) {
      updateBuyerPreferences(from, { category: 'plot', categoryLabel: 'Residential Plot', bedrooms: 0 });
      return promptBuyerBudget(from, prefs.purpose === 'rent', `Plot in ${city}`);
    } else {
      updateBuyerPreferences(from, { category: 'apartment', categoryLabel: 'Flat / Apartment' });
      return promptBuyerBhk(from, 'Flat / Apartment', city);
    }
  }

  if (actionId?.startsWith('buyer_bhk_') || session.currentStep === 'buyer_step4_bhk') {
    let count = 2;
    if (actionId === 'buyer_bhk_1' || rawInput.includes('1')) count = 1;
    else if (actionId === 'buyer_bhk_2' || rawInput.includes('2')) count = 2;
    else if (actionId === 'buyer_bhk_3' || rawInput.includes('3')) count = 3;
    else if (actionId === 'buyer_bhk_4' || rawInput.includes('4')) count = 4;

    const prefs = session.buyerPreferences || {};
    updateBuyerPreferences(from, { bedrooms: count });
    const summary = `${count} BHK ${prefs.categoryLabel || 'Flat'} in ${prefs.city || 'Indore'}`;
    return promptBuyerBudget(from, prefs.purpose === 'rent', summary);
  }

  if (actionId?.startsWith('buyer_budget_') || actionId?.startsWith('buyer_rent_') || session.currentStep === 'buyer_step5_budget') {
    const isRent = session.buyerPreferences?.purpose === 'rent';
    let minPrice: number | undefined = undefined;
    let maxPrice: number | undefined = undefined;
    let budgetLabel = '';

    if (actionId === 'buyer_budget_50l') {
      maxPrice = 5000000;
      budgetLabel = 'Under ₹50 Lakhs';
    } else if (actionId === 'buyer_budget_1cr') {
      minPrice = 5000000;
      maxPrice = 10000000;
      budgetLabel = '₹50L - ₹1 Crore';
    } else if (actionId === 'buyer_budget_above') {
      minPrice = 10000000;
      budgetLabel = 'Above ₹1 Crore';
    } else if (actionId === 'buyer_rent_15k') {
      maxPrice = 15000;
      budgetLabel = 'Under ₹15,000/mo';
    } else if (actionId === 'buyer_rent_30k') {
      minPrice = 15000;
      maxPrice = 30000;
      budgetLabel = '₹15,000 - ₹30,000/mo';
    } else if (actionId === 'buyer_rent_above') {
      minPrice = 30000;
      budgetLabel = 'Above ₹30,000/mo';
    } else if (rawInput) {
      const numMatch = rawInput.match(/(\d+(?:\.\d+)?)\s*(cr|crore|lakh|lac|k|thousand)?/i);
      if (numMatch) {
        let val = parseFloat(numMatch[1]);
        const unit = (numMatch[2] || '').toLowerCase();
        if (unit.startsWith('cr')) val *= 10000000;
        else if (unit.startsWith('l')) val *= 100000;
        else if (unit.startsWith('k')) val *= 1000;
        maxPrice = Math.round(val);
        minPrice = Math.round(val * 0.7);
        budgetLabel = `Around ${rawInput}`;
      } else {
        const prefs = session.buyerPreferences || {};
        const summary = `${prefs.bedrooms || 2} BHK ${prefs.categoryLabel || 'Flat'} in ${prefs.city || 'Indore'}`;
        return promptBuyerBudget(from, isRent, summary);
      }
    }

    updateBuyerPreferences(from, { minPrice, maxPrice, budgetLabel });
    return executeBuyerSearch(from);
  }

  if (actionId === 'buyer_action_visit') {
    setSessionStep(from, 'booking_visit');
    const visitMsg = `*SCHEDULE A FREE VERIFIED SITE VISIT* 📅\n------------------------------\nWhich property or locality would you like to visit?\n\nPlease reply with the Property Title, ID, or Locality (e.g., "Scheme 78 3BHK" or "Vijay Nagar Flat").\n\nOur certified partner broker will coordinate your private guided viewing with verified seller documentation. 🤝`;
    await sendTextMessage(from, visitMsg);
    return true;
  }

  if (actionId === 'buyer_action_broker') {
    const brokerHelp = `*BROKER PARTNER ACCESS* 💼\n------------------------------\nAre you a certified real estate broker or property owner?\n\nSend your partner referral code to log in:\n*LOGIN: <CODE>* (e.g., *LOGIN: APEX-PRIME* or *LOGIN: INDORE1001*)\n\n*Partner Privileges:*\n• 🎙️ Voice-to-Listing (Send 30-sec audio voice notes)\n• 🎁 First 5 properties free for 15 days\n• 📥 Direct WhatsApp buyer enquiries inbox`;
    await sendButtonMessage(from, brokerHelp, [
      { id: 'broker_action_voice', title: '🎙️ Voice Listing' },
      { id: 'broker_action_list', title: '📝 List Property' },
      { id: 'buyer_action_restart', title: '🔍 Search Catalog' },
    ]);
    return true;
  }

  if (session.currentStep === 'booking_visit') {
    setSessionStep(from, 'idle');
    const query = rawInput.toLowerCase();
    const allProps = getAllProperties();
    const matched = allProps.find(
      (p) =>
        p.id.toLowerCase() === query ||
        p.title.toLowerCase().includes(query) ||
        p.locality.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
    ) || allProps[0];

    if (matched) {
      createLead({
        propertyId: matched.id,
        propertyTitle: matched.title,
        propertyPrice: matched.formattedPrice,
        brokerId: matched.broker.id,
        brokerStoreCode: matched.broker.storeCode || matched.broker.id,
        buyerName: userName || 'WhatsApp Buyer',
        buyerPhone: cleanPhone,
        message: `Direct site visit request from WhatsApp: "${rawInput}"`,
        preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        source: 'whatsapp',
        status: 'new',
      });

      const confirmMsg = `*SITE VISIT SCHEDULED SUCCESSFULLY!* ✅\n------------------------------\n• 🏠 *Property:* ${matched.title}\n• 📍 *Location:* ${matched.locality}, ${matched.city}\n• 💰 *Price:* ${matched.formattedPrice}\n• 👤 *Assigned Broker:* ${matched.broker.name} (${matched.broker.agency})\n------------------------------\nThe partner advisor will connect with you on WhatsApp (+91 ${cleanPhone}) to confirm the viewing time. 🤝`;

      await sendButtonMessage(from, confirmMsg, [
        { id: 'buyer_action_restart', title: '🔍 Search More' },
        { id: 'buyer_action_broker', title: '💼 Broker Access' },
      ]);
      return true;
    }
  }

  const directMatch = matchIndianCity(rawInput);
  if (directMatch) {
    updateBuyerPreferences(from, {
      city: directMatch.city,
      state: directMatch.state,
      purpose: rawInput.toLowerCase().includes('rent') ? 'rent' : 'sale',
    });
    return promptBuyerLocality(from, directMatch.city);
  }

  return promptBuyerIntent(from, userName);
}
