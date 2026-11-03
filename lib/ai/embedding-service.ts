import { getAllProperties } from '../db/properties-store';
import { getAllBrokers } from '../auth/user-store';

export interface EmbeddingRecord {
  id: string;
  entityType: 'property' | 'broker' | 'locality' | 'faq_knowledge';
  entityId: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export function generatePlatformCorpus(): EmbeddingRecord[] {
  const records: EmbeddingRecord[] = [];
  const properties = getAllProperties();
  const brokers = getAllBrokers();

  for (const p of properties) {
    const textCorpus = [
      `Property Title: ${p.title}`,
      `Category: ${p.categoryLabel} (${p.category})`,
      `Purpose: ${p.purpose === 'sale' ? 'For Sale' : 'For Rent/Lease'}`,
      `Price: ${p.formattedPrice} (${p.formattedPricePerSqft})`,
      `Location: ${p.locality}, ${p.city}, ${p.address}. Landmark: ${p.landmark}`,
      `Configuration: ${p.bedrooms > 0 ? `${p.bedrooms} BHK` : 'Commercial/Plot'}`,
      `Carpet Area: ${p.carpetAreaSqft} sq.ft, Builtup: ${p.superBuiltupSqft} sq.ft`,
      `Furnishing: ${p.furnishing.replace(/_/g, ' ')}, Possession: ${p.possession.replace(/_/g, ' ')}`,
      `RERA Number: ${p.reraId} (Self-reported)`,
      `Amenities: ${p.amenities.join(', ')}`,
      `Broker In-Charge: ${p.broker.name} from ${p.broker.agency} (Store Code: ${p.broker.storeCode || p.broker.id}, Phone: ${p.broker.phone})`,
      `Detailed Overview: ${p.description}`,
    ].join('\n');

    records.push({
      id: `emb-prop-${p.id}`,
      entityType: 'property',
      entityId: p.id,
      title: p.title,
      content: textCorpus,
      metadata: {
        slug: p.slug,
        city: p.city,
        locality: p.locality,
        price: p.price,
        formattedPrice: p.formattedPrice,
        category: p.category,
        purpose: p.purpose,
        bedrooms: p.bedrooms,
        brokerName: p.broker.name,
        brokerStoreCode: p.broker.storeCode || p.broker.id,
        brokerPhone: p.broker.phone,
      },
    });
  }

  for (const b of brokers) {
    const bProps = properties.filter(
      (p) => (p.broker.storeCode || p.broker.id) === (b.storeCode || b.id) || p.broker.id === b.id
    );

    const brokerCorpus = [
      `Broker Name: ${b.fullName}`,
      `Agency: ${b.agencyName || 'Independent Broker Network'}`,
      `Storefront Code: ${b.storeCode || b.id}`,
      `Operating City: ${b.operatingCity || 'India'}`,
      `RERA Number: ${b.reraNumber || 'Self-declared'}`,
      `Experience: ${b.experienceYears || 10} Years in Real Estate Advisory`,
      `Active Listings Count: ${bProps.length}`,
      `Listed Properties: ${bProps.map((p) => `${p.title} (${p.formattedPrice}) in ${p.locality}`).join('; ')}`,
      `Contact Phone: ${b.phone}, Email: ${b.email}`,
    ].join('\n');

    records.push({
      id: `emb-broker-${b.id}`,
      entityType: 'broker',
      entityId: b.id,
      title: `${b.fullName} - ${b.agencyName}`,
      content: brokerCorpus,
      metadata: {
        storeCode: b.storeCode || b.id,
        city: b.operatingCity,
        phone: b.phone,
        agencyName: b.agencyName,
      },
    });
  }

  const knowledgeBase = [
    {
      title: 'How to list property on BrokersBlitz',
      content: 'Brokers can list residential, commercial, penthouses, villas, or land plots by navigating to Dashboard or using the WhatsApp Bot. Required details: City, State, Locality, Pricing, Carpet area, and self-reported RERA registration number.',
      metadata: { category: 'broker_guide' },
    },
    {
      title: 'How to schedule site visits',
      content: 'Site visits can be scheduled directly via the BlitzBot Chatbot or WhatsApp. Buyers choose property, pick preferred date and time slot, and login to lock in the appointment.',
      metadata: { category: 'site_visit' },
    },
    {
      title: 'RERA compliance and verification policy',
      content: 'BrokersBlitz mandates that brokers submit their state RERA certificate number (MahaRERA, K-RERA, HRERA, TNRERA, TS RERA, etc.). Buyers are advised to independently verify RERA numbers on official government portals before signing sale agreements.',
      metadata: { category: 'legal_rera' },
    },
    {
      title: 'Direct broker communication & anti-spam policy',
      content: 'BrokersBlitz protects customer phone numbers from telemarketing scrapers. Communications flow securely through verified bot channels or explicit buyer-broker approvals.',
      metadata: { category: 'privacy' },
    },
  ];

  for (let i = 0; i < knowledgeBase.length; i++) {
    const k = knowledgeBase[i];
    records.push({
      id: `emb-faq-${i + 1}`,
      entityType: 'faq_knowledge',
      entityId: `faq-${i + 1}`,
      title: k.title,
      content: k.content,
      metadata: k.metadata,
    });
  }

  return records;
}

export async function fetchOpenAIEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: 'text-embedding-3-small',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}
