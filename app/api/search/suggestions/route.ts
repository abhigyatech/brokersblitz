import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery, parseQueryWithOpenAI } from '@/lib/ai/ai-search-parser';
import { getAllProperties } from '@/lib/db/properties-store';
import { getAllBrokers } from '@/lib/auth/user-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
  const city = searchParams.get('city') || '';
  return handleSuggestions(query, city);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || body.q || '').trim();
    const city = body.city || '';
    return handleSuggestions(query, city);
  } catch {
    return NextResponse.json({ success: false, smartSearches: [], brokerStores: [], properties: [] });
  }
}

async function handleSuggestions(query: string, preferredCity?: string) {
  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      query: '',
      smartSearches: [],
      brokerStores: [],
      properties: [],
    });
  }

  let parsed = parseNaturalLanguageQuery(query);
  const openAiKey = process.env.OPENAI_API_KEY;

  if (openAiKey && openAiKey.trim() !== '') {
    try {
      const aiParsed = await parseQueryWithOpenAI(query, openAiKey);
      if (aiParsed) {
        parsed = { ...parsed, ...aiParsed };
      }
    } catch {}
  }

  if (!parsed.city && preferredCity && preferredCity !== 'Pan India' && preferredCity !== 'All India') {
    parsed.city = preferredCity;
  }

  const qLower = query.toLowerCase();
  const allBrokers = getAllBrokers().filter((b) => !b.isLocked);
  const scoredBrokers = allBrokers.map((b) => {
    let score = 0;
    const agencyLower = (b.agencyName || '').toLowerCase();
    const nameLower = (b.fullName || '').toLowerCase();
    const cityLower = (b.operatingCity || '').toLowerCase();
    const storeCodeLower = (b.storeCode || '').toLowerCase();

    if (parsed.brokerKeyword && (agencyLower.includes(parsed.brokerKeyword) || nameLower.includes(parsed.brokerKeyword))) {
      score += 15;
    }
    if (parsed.city && cityLower === parsed.city.toLowerCase()) {
      score += 8;
    }
    if (qLower.includes(cityLower)) {
      score += 6;
    }
    if (agencyLower.includes(qLower) || nameLower.includes(qLower) || storeCodeLower.includes(qLower)) {
      score += 10;
    }
    const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
    for (const w of qWords) {
      if (agencyLower.includes(w)) score += 3;
      if (nameLower.includes(w)) score += 3;
    }
    return { broker: b, score };
  });

  scoredBrokers.sort((a, b) => b.score - a.score || (b.broker.experienceYears || 0) - (a.broker.experienceYears || 0));
  const topBrokers = scoredBrokers
    .filter((sb, idx) => sb.score > 0 || idx < 2)
    .slice(0, 2)
    .map((sb) => ({
      id: sb.broker.id,
      name: sb.broker.fullName,
      agency: sb.broker.agencyName || 'Authorized Realty Advisory',
      storeCode: sb.broker.storeCode || sb.broker.id,
      city: sb.broker.operatingCity || 'Pan India',
      reraNumber: sb.broker.reraNumber || 'Self-Reported',
      experienceYears: sb.broker.experienceYears || 10,
      avatar: sb.broker.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      url: `/broker/${sb.broker.storeCode || sb.broker.id}`,
    }));

  const allProperties = getAllProperties().filter((p) => p.status !== 'paused' && p.status !== 'sold');
  const scoredProps = allProperties.map((p) => {
    let score = 0;
    const titleLower = p.title.toLowerCase();
    const locLower = p.locality.toLowerCase();
    const cityLower = p.city.toLowerCase();

    if (parsed.bhk && String(p.bedrooms) === String(parsed.bhk)) {
      score += 10;
    }
    if (parsed.category && p.category === parsed.category) {
      score += 8;
    }
    if (parsed.city && cityLower.includes(parsed.city.toLowerCase())) {
      score += 8;
    }
    if (parsed.locality && (locLower.includes(parsed.locality.toLowerCase()) || titleLower.includes(parsed.locality.toLowerCase()))) {
      score += 12;
    }
    if (parsed.purpose && p.purpose === parsed.purpose) {
      score += 4;
    }
    if (parsed.maxPrice && p.price <= parsed.maxPrice) {
      score += 4;
    }

    const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
    for (const w of qWords) {
      if (titleLower.includes(w)) score += 3;
      if (locLower.includes(w)) score += 4;
      if (cityLower.includes(w)) score += 2;
    }

    return { prop: p, score };
  });

  scoredProps.sort((a, b) => b.score - a.score || b.prop.viewsCount - a.prop.viewsCount);
  let topProps = scoredProps.filter((sp) => sp.score > 0).slice(0, 5);

  if (topProps.length === 0) {
    topProps = scoredProps.slice(0, 3);
  }

  const propertySuggestions = topProps.map((sp) => ({
    id: sp.prop.id,
    slug: sp.prop.slug,
    title: sp.prop.title,
    formattedPrice: sp.prop.formattedPrice,
    categoryLabel: sp.prop.categoryLabel,
    category: sp.prop.category,
    bedrooms: sp.prop.bedrooms,
    locality: sp.prop.locality,
    city: sp.prop.city,
    primaryImage: sp.prop.primaryImage,
    url: `/property/${sp.prop.slug}`,
  }));

  const smartSearches: Array<{
    title: string;
    subtitle: string;
    url: string;
    type: 'bhk' | 'locality' | 'city' | 'category' | 'general';
  }> = [];

  if (parsed.bhk && parsed.city) {
    smartSearches.push({
      title: `${parsed.bhk} BHK Properties in ${parsed.city}`,
      subtitle: `View verified ${parsed.bhk} BHK flats and residences in ${parsed.city}`,
      url: `/search?city=${encodeURIComponent(parsed.city)}&bhk=${encodeURIComponent(parsed.bhk)}`,
      type: 'bhk',
    });
  } else if (parsed.bhk) {
    smartSearches.push({
      title: `${parsed.bhk} BHK Properties across Pan India`,
      subtitle: `Filter by ${parsed.bhk} BHK inventory across top Indian metros`,
      url: `/search?bhk=${encodeURIComponent(parsed.bhk)}`,
      type: 'bhk',
    });
  }

  if (parsed.locality) {
    const targetCity = parsed.city || preferredCity || 'Pan India';
    smartSearches.push({
      title: `Properties in ${parsed.locality}`,
      subtitle: `Explore residential and commercial spaces around ${parsed.locality}`,
      url: `/search?query=${encodeURIComponent(parsed.locality)}${parsed.city ? `&city=${encodeURIComponent(parsed.city)}` : ''}`,
      type: 'locality',
    });
  }

  if (parsed.category) {
    smartSearches.push({
      title: `${parsed.category.replace(/_/g, ' ').toUpperCase()} listings`,
      subtitle: `Browse all ${parsed.category.replace(/_/g, ' ')} properties`,
      url: `/search?category=${encodeURIComponent(parsed.category)}${parsed.city ? `&city=${encodeURIComponent(parsed.city)}` : ''}`,
      type: 'category',
    });
  }

  smartSearches.push({
    title: `View all results for "${query}"`,
    subtitle: `Search full Pan India inventory with advanced filters`,
    url: `/search?query=${encodeURIComponent(query)}${parsed.city ? `&city=${encodeURIComponent(parsed.city)}` : ''}`,
    type: 'general',
  });

  return NextResponse.json({
    success: true,
    query,
    smartSearches: smartSearches.slice(0, 3),
    brokerStores: topBrokers,
    properties: propertySuggestions,
    parsed,
  });
}

