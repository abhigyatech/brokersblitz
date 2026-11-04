import fs from 'fs';
import path from 'path';
import { PropertyListing } from '../../data/types';
import { StoredUser } from '../auth/user-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');

function ensurePropertiesFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllProperties(): PropertyListing[] {
  ensurePropertiesFile();
  try {
    if (!fs.existsSync(PROPERTIES_FILE)) return [];
    const content = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
    return JSON.parse(content) as PropertyListing[];
  } catch {
    return [];
  }
}

export function saveProperties(properties: PropertyListing[]): void {
  ensurePropertiesFile();
  fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(properties, null, 2), 'utf-8');
}

export function getPropertyById(id: string): PropertyListing | null {
  const properties = getAllProperties();
  return properties.find((p) => p.id === id || p.slug === id) || null;
}

export function getPropertyBySlug(slug: string): PropertyListing | null {
  const properties = getAllProperties();
  return properties.find((p) => p.slug === slug || p.id === slug) || null;
}

export function getPropertiesByBroker(storeCodeOrName: string): PropertyListing[] {
  const properties = getAllProperties();
  const normalized = storeCodeOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return properties.filter((p) => {
    const code = (p.broker.storeCode || p.broker.id).toLowerCase().replace(/[^a-z0-9]/g, '');
    const brokerName = p.broker.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const agencyName = (p.broker.agency || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return code === normalized || brokerName === normalized || agencyName.includes(normalized);
  });
}

function formatPriceNumber(num: number): string {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export function createProperty(data: Partial<PropertyListing>, user: StoredUser): PropertyListing {
  const properties = getAllProperties();
  const id = `prop-${Date.now()}`;
  const price = Number(data.price) || 5000000;
  const carpetArea = Number(data.carpetAreaSqft) || 1000;
  const pricePerSqft = Math.round(price / carpetArea);
  const title = (data.title || 'Direct Property Listing').trim();
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

  const storeCode = (user.agencyName || user.fullName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const newProperty: PropertyListing = {
    id,
    title,
    slug,
    category: data.category || 'apartment',
    categoryLabel: data.categoryLabel || `${data.bedrooms || 3} BHK Apartment`,
    purpose: data.purpose || 'sale',
    price,
    formattedPrice: formatPriceNumber(price),
    pricePerSqft,
    formattedPricePerSqft: `₹${pricePerSqft.toLocaleString('en-IN')} / sq.ft`,
    maintenanceMonthly: data.maintenanceMonthly || 0,
    city: data.city || 'Mumbai',
    locality: data.locality || 'Prime Corridor',
    address: data.address || `${data.locality || 'Main Corridor'}, ${data.city || 'Mumbai'}`,
    landmark: data.landmark || 'Near Metro & Business Hub',
    pincode: data.pincode || '400001',
    bedrooms: Number(data.bedrooms) || 0,
    bathrooms: Number(data.bathrooms) || 1,
    balconies: Number(data.balconies) || 1,
    carpetAreaSqft: carpetArea,
    superBuiltupSqft: data.superBuiltupSqft || Math.round(carpetArea * 1.3),
    furnishing: data.furnishing || 'semi_furnished',
    possession: data.possession || 'ready_to_move',
    floorInfo: data.floorInfo || 'Mid Floor',
    carParking: Number(data.carParking) || 1,
    facing: data.facing || 'East',
    reraId: data.reraId || user.reraNumber || 'Self-Reported',
    isReraApproved: true,
    isFeatured: true,
    isTopSearch: false,
    status: 'active',
    primaryImage: data.primaryImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    additionalImages: data.additionalImages || [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: data.amenities && data.amenities.length > 0 ? data.amenities : [
      '24/7 Security & CCTV',
      'Covered Parking',
      'High-Speed Elevators',
      'Power Backup'
    ],
    description: data.description || 'Direct broker listing on BrokersBlitz platform with declared RERA registration (verify on state portal).',
    viewsCount: 1,
    leadsCount: 0,
    broker: {
      id: user.id,
      name: user.fullName,
      storeCode,
      agency: user.agencyName || 'Independent Broker Network',
      phone: user.phone,
      whatsapp: user.phone,
      reraNumber: user.reraNumber || 'A51900010482',
      isReraVerified: false,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      experienceYears: 10,
      totalListings: properties.filter((p) => p.broker.name === user.fullName).length + 1,
      rating: 4.9,
      responseTime: 'Within 15 mins',
      bio: `Dedicated property advisor with ${user.agencyName || 'Independent Broker Network'}.`,
      city: user.operatingCity || data.city || 'Mumbai',
    },
    createdAt: new Date().toISOString(),
  };

  properties.unshift(newProperty);
  saveProperties(properties);
  return newProperty;
}

export function updateProperty(id: string, updates: Partial<PropertyListing>): PropertyListing | null {
  const properties = getAllProperties();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = properties[index];
  const updated: PropertyListing = {
    ...current,
    ...updates,
    price: updates.price ? Number(updates.price) : current.price,
    formattedPrice: updates.price ? formatPriceNumber(Number(updates.price)) : current.formattedPrice,
  };

  properties[index] = updated;
  saveProperties(properties);
  return updated;
}

export function updatePropertyStatus(id: string, status: 'active' | 'paused' | 'sold' | 'expired'): PropertyListing | null {
  return updateProperty(id, { status });
}

export function deleteProperty(id: string): boolean {
  const properties = getAllProperties();
  const filtered = properties.filter((p) => p.id !== id);
  if (filtered.length === properties.length) return false;
  saveProperties(filtered);
  return true;
}

export function searchProperties(filters: {
  city?: string;
  purpose?: string;
  category?: string;
  query?: string;
  bhk?: string;
  budget?: string;
  minPrice?: number;
  maxPrice?: number;
  possession?: string;
  furnishing?: string;
  reraOnly?: boolean;
}): PropertyListing[] {
  const properties = getAllProperties();
  return properties.filter((p) => {
    if (filters.city && filters.city !== 'Pan India' && filters.city !== 'All India' && p.city.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }
    if (filters.purpose && filters.purpose !== 'all' && p.purpose !== filters.purpose) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && p.category !== filters.category) {
      return false;
    }
    if (filters.bhk && filters.bhk !== 'all') {
      if (filters.bhk === '4+' && p.bedrooms < 4) return false;
      if (filters.bhk !== '4+' && p.bedrooms !== parseInt(filters.bhk, 10)) return false;
    }
    if (filters.possession && filters.possession !== 'all' && p.possession !== filters.possession) {
      return false;
    }
    if (filters.furnishing && filters.furnishing !== 'all' && p.furnishing !== filters.furnishing) {
      return false;
    }
    if (filters.reraOnly && !p.isReraApproved) {
      return false;
    }
    if (filters.minPrice !== undefined && p.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) {
      return false;
    }
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.broker.name.toLowerCase().includes(q) ||
        p.broker.agency.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

