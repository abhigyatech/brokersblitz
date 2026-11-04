import { DraftListingData } from './types';
import { callOpenAIChatCompletion } from '../ai/ai-llm-service';

export async function transcribeAudioWithWhisper(
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const cleanMime = mimeType.split(';')[0].trim().toLowerCase() || 'audio/ogg';
    const ext = cleanMime.includes('mp4') || cleanMime.includes('m4a')
      ? 'm4a'
      : cleanMime.includes('wav')
      ? 'wav'
      : cleanMime.includes('mp3')
      ? 'mp3'
      : 'ogg';

    const file = new File([new Uint8Array(audioBuffer)], `voice_listing.${ext}`, { type: cleanMime });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append(
      'prompt',
      'Indian real estate property listing voice note in Hindi, Hinglish, and English. Numbers and prices: 20 lakh, 25 lakh, 30 lakh, 35 lakh, 40 lakh, 45 lakh, 50 lakh, 55 lakh, 60 lakh, 65 lakh, 70 lakh, 75 lakh, 80 lakh, 85 lakh, 90 lakh, 95 lakh, 1 crore, 1.25 crore, 1.5 crore, 2 crore. Configurations: 1 BHK, 2 BHK, 3 BHK, 4 BHK flat, apartment, villa, plot, duplex. Localities: Scheme 78, Vijay Nagar, Super Corridor, Palasia, Indore, Mumbai, Pune, Bhopal, Delhi NCR. Features: lift, parking, covered car parking, road facing, ready to move, urgent sale, negotiable.'
    );
    formData.append('temperature', '0');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Whisper API Error ${res.status}]:`, errText);
      return null;
    }

    const data = await res.json();
    const transcript = data?.text?.trim() || null;
    console.log(`[Whisper Audio Transcript]: "${transcript}"`);
    return transcript;
  } catch (err: any) {
    console.error('[Whisper Audio Exception]:', err.message);
    return null;
  }
}

export function heuristicExtractProperty(rawText: string, defaultCity: string = 'Indore'): DraftListingData {
  const text = rawText.toLowerCase();

  let purpose: 'sale' | 'rent' = 'sale';
  if (text.includes('rent') || text.includes('kiraya') || text.includes('lease') || text.includes('to let')) {
    purpose = 'rent';
  }

  let bedrooms = 2;
  const bhkMatch = text.match(/([1-5])\s*bhk/i) || text.match(/([1-5])\s*bedroom/i);
  if (bhkMatch) {
    bedrooms = parseInt(bhkMatch[1], 10);
  } else if (text.includes('single bhk') || text.includes('1 bhk') || text.includes('ek bhk')) {
    bedrooms = 1;
  } else if (text.includes('2 bhk') || text.includes('do bhk')) {
    bedrooms = 2;
  } else if (text.includes('3 bhk') || text.includes('teen bhk')) {
    bedrooms = 3;
  } else if (text.includes('4 bhk') || text.includes('chaar bhk')) {
    bedrooms = 4;
  }

  let category = 'apartment';
  let categoryLabel = `${bedrooms} BHK Apartment`;
  if (text.includes('plot') || text.includes('land') || text.includes('zameen')) {
    category = 'plot';
    categoryLabel = 'Residential Plot';
    bedrooms = 0;
  } else if (text.includes('villa') || text.includes('bungalow') || text.includes('kothi') || text.includes('house') || text.includes('independent house')) {
    category = 'villa';
    categoryLabel = `${bedrooms} BHK Villa / House`;
  } else if (text.includes('office') || text.includes('dukan') || text.includes('shop') || text.includes('commercial')) {
    category = 'commercial';
    categoryLabel = 'Commercial Property';
    bedrooms = 0;
  }

  let carpetAreaSqft = bedrooms === 3 ? 1500 : bedrooms === 2 ? 1050 : bedrooms === 1 ? 650 : 1200;
  const sqftMatch = text.match(/([0-9]{3,5})\s*(sq\s*ft|sqft|square\s*feet|gaj|feet)/i);
  if (sqftMatch) {
    carpetAreaSqft = parseInt(sqftMatch[1], 10);
  }

  let price = purpose === 'rent' ? 25000 : 5000000;
  const crMatch = text.match(/([0-9.]+)\s*(cr|crore|karod)/i);
  const lakhMatch = text.match(/([0-9.]+)\s*(lakh|lac|lac\b|lakhs|l\b)/i);
  const thousandMatch = text.match(/([0-9]+)\s*(k|thousand|hazar)/i);

  if (crMatch) {
    price = Math.round(parseFloat(crMatch[1]) * 10000000);
  } else if (lakhMatch) {
    price = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else if (thousandMatch) {
    price = parseInt(thousandMatch[1], 10) * 1000;
  } else if (text.includes('pachaas lakh') || text.includes('pachas lakh')) {
    price = 5000000;
  } else if (text.includes('saath lakh') || text.includes('sath lakh')) {
    price = 6000000;
  } else if (text.includes('sattar lakh')) {
    price = 7000000;
  } else if (text.includes('pachattar lakh') || text.includes('pachhattar lakh')) {
    price = 7500000;
  } else if (text.includes('assi lakh')) {
    price = 8000000;
  } else if (text.includes('nabbe lakh')) {
    price = 9000000;
  } else if (text.includes('ek crore') || text.includes('ek karod')) {
    price = 10000000;
  }

  let city = defaultCity || 'Indore';
  const cities = ['Indore', 'Mumbai', 'Pune', 'Bhopal', 'Delhi', 'Gurgaon', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Jaipur'];
  for (const c of cities) {
    if (text.includes(c.toLowerCase())) {
      city = c;
      break;
    }
  }

  let locality = 'Prime Corridor';
  const schemeMatch = text.match(/(scheme\s*[0-9]+[a-z]?)/i);
  const sectorMatch = text.match(/(sector\s*[0-9]+[a-z]?)/i);
  const vijayMatch = text.match(/(vijay\s*nagar|palasia|ab\s*road|nipania|bicholi|super\s*corridor|rau|kanadia|bhanwarkuan|annapurna)/i);
  const mumbaiLocMatch = text.match(/(bandra|andheri|juhu|worli|powai|thane|navi\s*mumbai)/i);

  if (schemeMatch) {
    locality = schemeMatch[1].toUpperCase();
  } else if (sectorMatch) {
    locality = sectorMatch[1].toUpperCase();
  } else if (vijayMatch) {
    locality = vijayMatch[1].replace(/\b\w/g, (l) => l.toUpperCase());
  } else if (mumbaiLocMatch) {
    locality = mumbaiLocMatch[1].replace(/\b\w/g, (l) => l.toUpperCase());
  }

  let floorInfo = 'Middle Floor';
  const floorMatch = text.match(/([0-9]+)(?:st|nd|rd|th)?\s*floor/i) || text.match(/ground\s*floor/i);
  if (floorMatch) {
    floorInfo = floorMatch[0].replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const amenities: string[] = [];
  if (text.includes('lift')) amenities.push('High-Speed Elevators');
  if (text.includes('parking') || text.includes('car')) amenities.push('Covered Parking');
  if (text.includes('security') || text.includes('guard')) amenities.push('24/7 Security & CCTV');
  if (text.includes('power') || text.includes('backup')) amenities.push('Power Backup');
  if (amenities.length === 0) {
    amenities.push('Covered Parking', '24/7 Water Supply', 'High-Speed Elevators');
  }

  let furnishing: 'furnished' | 'semi_furnished' | 'unfurnished' = 'semi_furnished';
  if (text.includes('fully furnished') || text.includes('furnished')) {
    furnishing = 'furnished';
  } else if (text.includes('raw') || text.includes('unfurnished')) {
    furnishing = 'unfurnished';
  }

  const isNegotiable = text.includes('negotiable') || text.includes('kam ho jayega') || text.includes('thoda');
  const urgency = text.includes('urgent') || text.includes('jaldi') ? 'Urgent Distress Sale' : 'Standard Market Listing';

  const title = categoryLabel.toLowerCase().includes('bhk')
    ? `${categoryLabel} in ${locality}, ${city}`
    : `${bedrooms > 0 ? `${bedrooms} BHK ` : ''}${categoryLabel} in ${locality}, ${city}`;

  return {
    title,
    purpose,
    category,
    categoryLabel,
    bedrooms,
    bathrooms: Math.max(1, bedrooms),
    carpetAreaSqft,
    price,
    city,
    locality,
    address: `${locality}, Near Metro & Arterial Corridor, ${city}`,
    floorInfo,
    furnishing,
    amenities,
    description: `Direct broker listing via WhatsApp voice note: ${rawText}`,
    isNegotiable,
    urgency,
    rawVoiceTranscript: rawText,
  };
}

export async function extractPropertyFromVoiceTranscript(
  transcript: string,
  brokerCity: string = 'Indore'
): Promise<DraftListingData> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return heuristicExtractProperty(transcript, brokerCity);
  }

  const systemPrompt = `You are an expert Indian Real Estate Parser for BrokersBlitz.
A broker sent a WhatsApp audio message or voice note in Hindi, Hinglish, or English describing a property.
Extract all details into a strictly valid JSON object without markdown code blocks.

CRITICAL NUMERICAL ACCURACY INSTRUCTIONS:
- Price must be converted to an exact Indian Rupee (INR) integer.
- Pay meticulous attention to Hindi and Hinglish numbers:
  * "50 lakh" or "pachaas lakh" or "50L" -> 5000000
  * "55 lakh" or "pachpan lakh" -> 5500000
  * "60 lakh" or "saath lakh" -> 6000000
  * "65 lakh" or "painsath lakh" -> 6500000
  * "70 lakh" or "sattar lakh" -> 7000000
  * "75 lakh" or "pachattar lakh" -> 7500000
  * "80 lakh" or "assi lakh" -> 8000000
  * "90 lakh" or "nabbe lakh" -> 9000000
  * "1 crore" or "ek karod" -> 10000000
  * "1.2 crore" or "ek point do karod" -> 12000000
  * "1.5 crore" or "dedh karod" -> 15000000
  * "2 crore" or "do karod" -> 20000000
  * "15k" or "15 hazar" rent -> 15000
  * "25k" or "25 hazar" rent -> 25000
  * "35k" or "35 hazar" rent -> 35000
- DO NOT confuse 50 lakh with 70 lakh or 75 lakh. Verify the exact number spoken.
- Extract bedrooms (1, 2, 3, 4) accurately.
- Extract locality and landmark (e.g. Scheme 78, Vijay Nagar, Sector 54, Bandra).
- Extract carpet area in sq ft.

JSON format expected:
{
  "title": string,
  "purpose": "sale" | "rent",
  "category": "apartment" | "villa" | "plot" | "commercial" | "office" | "retail_shop",
  "categoryLabel": string,
  "bedrooms": number,
  "bathrooms": number,
  "carpetAreaSqft": number,
  "price": number,
  "city": string,
  "locality": string,
  "floorInfo": string,
  "furnishing": "furnished" | "semi_furnished" | "unfurnished",
  "amenities": string[],
  "isNegotiable": boolean,
  "urgency": string,
  "description": string
}`;

  try {
    const responseText = await callOpenAIChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Broker operating city: ${brokerCity}\nVoice Note Transcript: "${transcript}"`,
        },
      ],
      apiKey
    );

    if (!responseText) {
      return heuristicExtractProperty(transcript, brokerCity);
    }

    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || `${parsed.bedrooms || 3} BHK Property in ${parsed.locality || 'Prime Location'}`,
      purpose: parsed.purpose === 'rent' ? 'rent' : 'sale',
      category: parsed.category || 'apartment',
      categoryLabel: parsed.categoryLabel || `${parsed.bedrooms || 3} BHK Apartment`,
      bedrooms: Number(parsed.bedrooms) || 0,
      bathrooms: Number(parsed.bathrooms) || 1,
      carpetAreaSqft: Number(parsed.carpetAreaSqft) || 1200,
      price: Number(parsed.price) || 5000000,
      city: parsed.city || brokerCity || 'Indore',
      locality: parsed.locality || 'Prime Corridor',
      address: `${parsed.locality || 'Prime Corridor'}, ${parsed.city || brokerCity || 'Indore'}`,
      floorInfo: parsed.floorInfo || 'Middle Floor',
      furnishing: parsed.furnishing || 'semi_furnished',
      amenities: Array.isArray(parsed.amenities) && parsed.amenities.length > 0
        ? parsed.amenities
        : ['Lift', 'Covered Parking', '24/7 Security'],
      description: parsed.description || `Direct broker listing parsed from WhatsApp voice note: "${transcript}"`,
      isNegotiable: Boolean(parsed.isNegotiable),
      urgency: parsed.urgency || 'Ready for Immediate Deal',
      rawVoiceTranscript: transcript,
    };
  } catch {
    return heuristicExtractProperty(transcript, brokerCity);
  }
}

export function formatPriceIndian(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Crore`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDraftSummaryCard(
  draft: DraftListingData,
  brokerInfo?: { name: string; agency: string; storeCode?: string; rera?: string }
): string {
  const priceDisplay = draft.price ? formatPriceIndian(draft.price) : 'Price on Request';
  const negotiableTag = draft.isNegotiable ? ' (Negotiable)' : '';
  const intentLabel = draft.purpose === 'rent' ? '🔑 For Rent' : '🏷️ For Sale';
  const amenitiesList = (draft.amenities || []).slice(0, 4).join(', ') || 'Covered Parking, Lift';

  let card = `*PROPERTY LISTING DRAFT* 📋\n------------------------------\n`;
  card += `• 🏷️ *Intent:* ${intentLabel}\n`;
  card += `• 🏠 *Configuration:* ${draft.categoryLabel || 'Residential Property'}\n`;
  card += `• 📐 *Super Area:* ${draft.carpetAreaSqft || 1000} sq.ft\n`;
  card += `• 🏢 *Floor:* ${draft.floorInfo || 'Mid Floor'}\n`;
  card += `• 📍 *Location:* ${draft.locality || 'Prime Locality'}, ${draft.city || 'Indore'}\n`;
  card += `• 💰 *Asking Price:* ${priceDisplay}${negotiableTag}\n`;
  card += `• 🛋️ *Furnishing:* ${draft.furnishing === 'furnished' ? 'Fully Furnished' : draft.furnishing === 'unfurnished' ? 'Raw / Unfurnished' : 'Semi-Furnished'}\n`;
  card += `• ✨ *Key Amenities:* ${amenitiesList}\n`;

  if (brokerInfo) {
    card += `------------------------------\n`;
    card += `• 👤 *Listing Broker:* ${brokerInfo.name} (${brokerInfo.agency})\n`;
    if (brokerInfo.storeCode) card += `• 🌐 *Partner Store:* brokersblitz.in/broker/${brokerInfo.storeCode}\n`;
    if (brokerInfo.rera) card += `• 📜 *RERA:* ${brokerInfo.rera}\n`;
  }

  card += `------------------------------\n`;
  if (draft.rawVoiceTranscript) {
    card += `*Transcript:* "${draft.rawVoiceTranscript}" 🎙️\n------------------------------\n`;
  }
  card += `*Need to fix anything?* ✏️\nReply with any correction (e.g. "Price 50 lakh" or "3 BHK" or "Vijay Nagar") or tap [Edit Details] below:`;
  return card;
}

export function applyCorrectionToDraft(
  draft: DraftListingData,
  input: string
): { updated: boolean; fieldName?: string; draft: DraftListingData } {
  const text = input.trim().toLowerCase();
  const updated: DraftListingData = { ...draft };

  const crMatch = text.match(/([0-9.]+)\s*(cr|crore|karod)/i);
  const lakhMatch = text.match(/([0-9.]+)\s*(lakh|lac|lac\b|lakhs|l\b)/i);
  const thousandMatch = text.match(/([0-9]+)\s*(k|thousand|hazar)/i);
  const rawNumOnly = text.match(/^([0-9]{5,9})$/);

  if (crMatch) {
    updated.price = Math.round(parseFloat(crMatch[1]) * 10000000);
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (lakhMatch) {
    updated.price = Math.round(parseFloat(lakhMatch[1]) * 100000);
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (thousandMatch) {
    updated.price = parseInt(thousandMatch[1], 10) * 1000;
    return { updated: true, fieldName: 'Monthly Rent', draft: updated };
  } else if (rawNumOnly) {
    updated.price = parseInt(rawNumOnly[1], 10);
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (text.includes('pachaas lakh') || text.includes('50 lakh') || text.includes('50l')) {
    updated.price = 5000000;
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (text.includes('60 lakh') || text.includes('saath lakh')) {
    updated.price = 6000000;
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (text.includes('70 lakh') || text.includes('sattar lakh')) {
    updated.price = 7000000;
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (text.includes('75 lakh') || text.includes('pachattar lakh')) {
    updated.price = 7500000;
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  } else if (text.includes('80 lakh') || text.includes('assi lakh')) {
    updated.price = 8000000;
    return { updated: true, fieldName: 'Asking Price', draft: updated };
  }

  const bhkMatch = text.match(/([1-5])\s*bhk/i);
  if (bhkMatch) {
    const b = parseInt(bhkMatch[1], 10);
    updated.bedrooms = b;
    updated.categoryLabel = `${b} BHK ${updated.category === 'villa' ? 'Villa' : 'Apartment'}`;
    updated.title = `${updated.categoryLabel} in ${updated.locality || 'Prime Location'}, ${updated.city || 'Indore'}`;
    return { updated: true, fieldName: 'Configuration', draft: updated };
  }

  const sqftMatch = text.match(/([0-9]{3,5})\s*(sq\s*ft|sqft|square\s*feet|feet)/i);
  if (sqftMatch) {
    updated.carpetAreaSqft = parseInt(sqftMatch[1], 10);
    return { updated: true, fieldName: 'Super Area', draft: updated };
  }

  if (text.includes('rent') || text.includes('kiraya')) {
    updated.purpose = 'rent';
    return { updated: true, fieldName: 'Listing Intent', draft: updated };
  } else if (text.includes('sale') || text.includes('bechna')) {
    updated.purpose = 'sale';
    return { updated: true, fieldName: 'Listing Intent', draft: updated };
  }

  if (text.startsWith('locality:') || text.startsWith('location:') || text.startsWith('area:')) {
    const loc = input.replace(new RegExp('^(locality|location|area):\\s*', 'i'), '').trim();
    if (loc) {
      updated.locality = loc;
      updated.address = `${loc}, ${updated.city || 'Indore'}`;
      updated.title = `${updated.categoryLabel || 'Property'} in ${loc}, ${updated.city || 'Indore'}`;
      return { updated: true, fieldName: 'Locality', draft: updated };
    }
  }

  if (text.length > 3 && !text.includes('publish') && !text.includes('discard') && !text.includes('cancel')) {
    const cleanedLoc = input.trim();
    updated.locality = cleanedLoc;
    updated.address = `${cleanedLoc}, ${updated.city || 'Indore'}`;
    updated.title = `${updated.categoryLabel || 'Property'} in ${cleanedLoc}, ${updated.city || 'Indore'}`;
    return { updated: true, fieldName: 'Locality', draft: updated };
  }

  return { updated: false, draft: updated };
}
