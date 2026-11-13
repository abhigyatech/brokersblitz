import { PropertyListing } from '../../data/types';
import { StoredUser } from '../auth/user-store';
import { query } from './postgres';

function formatPriceNumber(num: number): string {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

function mapRowToProperty(row: any): PropertyListing {
  const price = Number(row.price) || 0;
  const carpetArea = Number(row.carpet_area_sqft) || 0;
  const pricePerSqft = row.price_per_sqft
    ? Number(row.price_per_sqft)
    : carpetArea > 0
    ? Math.round(price / carpetArea)
    : 0;

  return {
    id: String(row.id),
    title: row.title || '',
    slug: row.slug || String(row.id),
    category: row.category || 'apartment',
    categoryLabel: row.category_label || `${row.bedrooms || 0} BHK`,
    purpose: row.purpose || 'sale',
    price,
    formattedPrice: row.formatted_price || formatPriceNumber(price),
    pricePerSqft,
    formattedPricePerSqft:
      row.formatted_price_per_sqft ||
      (pricePerSqft > 0 ? `₹${pricePerSqft.toLocaleString('en-IN')} / sq.ft` : '₹0 / sq.ft'),
    maintenanceMonthly: row.maintenance_charges_monthly ? Number(row.maintenance_charges_monthly) : 0,
    city: row.city || '',
    locality: row.locality || '',
    address: row.address_line || '',
    landmark: row.landmark || '',
    pincode: row.pincode || '',
    bedrooms: Number(row.bedrooms) || 0,
    bathrooms: Number(row.bathrooms) || 0,
    balconies: Number(row.balconies) || 0,
    carpetAreaSqft: carpetArea,
    superBuiltupSqft: row.super_builtup_area_sqft ? Number(row.super_builtup_area_sqft) : Math.round(carpetArea * 1.3),
    furnishing: row.furnishing || 'unfurnished',
    possession: row.possession || 'ready_to_move',
    floorInfo: row.floor_info || (row.floor_number ? `Floor ${row.floor_number}` : ''),
    carParking: Number(row.car_parking_slots) || 0,
    facing: row.facing || '',
    reraId: row.rera_id || '',
    isReraApproved: Boolean(row.is_rera_approved),
    isFeatured: Boolean(row.is_featured),
    isTopSearch: Boolean(row.is_top_of_search),
    status: row.status || 'active',
    primaryImage: row.primary_image_url || '',
    additionalImages: Array.isArray(row.additional_images) ? row.additional_images : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    description: row.description || '',
    viewsCount: Number(row.view_count) || 0,
    leadsCount: Number(row.lead_count) || 0,
    broker: {
      id: String(row.broker_id),
      name: row.broker_name || row.full_name || '',
      storeCode: row.store_code || '',
      agency: row.agency_name || '',
      phone: row.phone || '',
      whatsapp: row.phone || '',
      reraNumber: row.broker_rera || row.rera_number || '',
      isReraVerified: Boolean(row.is_rera_verified),
      avatar: row.avatar_url || '',
      experienceYears: Number(row.experience_years) || 1,
      totalListings: Number(row.broker_total_listings) || 1,
      rating: row.rating ? Number(row.rating) : 4.8,
      responseTime: 'Within 1 hour',
      bio: row.bio || '',
      city: row.city_of_operation || row.city || '',
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    isFreeListing: Boolean(row.is_free_listing),
    freeUntil: row.free_until ? new Date(row.free_until).toISOString() : undefined,
    listingFeePerDay: row.listing_fee_per_day ? Number(row.listing_fee_per_day) : 2,
    lastChargedAt: row.last_charged_at ? new Date(row.last_charged_at).toISOString() : undefined,
    priorityScore: row.priority_score ? Number(row.priority_score) : 1000,
  };
}

const BASE_QUERY = `
  SELECT 
    p.*,
    pr.full_name as broker_name,
    pr.agency_name,
    pr.phone,
    pr.store_code,
    pr.rera_number as broker_rera,
    pr.is_rera_verified,
    pr.avatar_url,
    pr.experience_years,
    pr.rating,
    pr.bio,
    pr.city_of_operation,
    (SELECT count(*) FROM public.properties p2 WHERE p2.broker_id = p.broker_id) as broker_total_listings
  FROM public.properties p
  LEFT JOIN public.profiles pr ON p.broker_id = pr.id
`;

export async function getAllProperties(): Promise<PropertyListing[]> {
  try {
    const res = await query(`${BASE_QUERY} ORDER BY p.priority_score DESC, p.created_at DESC`);
    return res.rows.map(mapRowToProperty);
  } catch {
    return [];
  }
}

export async function getPropertyById(id: string): Promise<PropertyListing | null> {
  if (!id) return null;
  try {
    const res = await query(`${BASE_QUERY} WHERE p.id::text = $1 OR p.slug = $1 LIMIT 1`, [id.trim()]);
    if (res.rows.length === 0) return null;
    return mapRowToProperty(res.rows[0]);
  } catch {
    return null;
  }
}

export async function getPropertyBySlug(slug: string): Promise<PropertyListing | null> {
  if (!slug) return null;
  return getPropertyById(slug);
}

export async function getPropertiesByBroker(storeCodeOrId: string): Promise<PropertyListing[]> {
  if (!storeCodeOrId) return [];
  const normalized = storeCodeOrId.toLowerCase().replace(/[^a-z0-9]/g, '');
  try {
    const res = await query(
      `${BASE_QUERY} WHERE p.broker_id::text = $1 
         OR lower(regexp_replace(coalesce(pr.store_code, ''), '[^a-zA-Z0-9]', '', 'g')) = $2
         OR lower(regexp_replace(coalesce(pr.agency_name, ''), '[^a-zA-Z0-9]', '', 'g')) = $2
         OR lower(regexp_replace(coalesce(pr.full_name, ''), '[^a-zA-Z0-9]', '', 'g')) = $2
       ORDER BY p.created_at DESC`,
      [storeCodeOrId, normalized]
    );
    return res.rows.map(mapRowToProperty);
  } catch {
    return [];
  }
}

export async function createProperty(data: Partial<PropertyListing>, user: StoredUser): Promise<PropertyListing> {
  const price = Number(data.price) || 0;
  const carpetArea = Number(data.carpetAreaSqft) || 1000;
  const pricePerSqft = carpetArea > 0 ? Math.round(price / carpetArea) : 0;
  const title = (data.title || 'Direct Property Listing').trim();
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;
  const formattedPrice = formatPriceNumber(price);
  const formattedPricePerSqft = `₹${pricePerSqft.toLocaleString('en-IN')} / sq.ft`;

  const validCategories = [
    'apartment', 'villa', 'penthouse', 'independent_house',
    'commercial_office', 'retail_shop', 'industrial_warehouse',
    'residential_plot', 'agricultural_land'
  ];
  const cat = validCategories.includes(String(data.category)) ? String(data.category) : 'apartment';

  const validPurposes = ['sale', 'rent', 'lease'];
  const purp = validPurposes.includes(String(data.purpose)) ? String(data.purpose) : 'sale';

  const validPossessions = ['ready_to_move', 'under_construction', 'resale', 'new_launch'];
  const poss = validPossessions.includes(String(data.possession)) ? String(data.possession) : 'ready_to_move';

  const validFurnishing = ['unfurnished', 'semi_furnished', 'fully_furnished', 'bare_shell'];
  const furn = validFurnishing.includes(String(data.furnishing)) ? String(data.furnishing) : 'unfurnished';

  const res = await query(
    `INSERT INTO public.properties (
      broker_id, title, slug, description, category, category_label,
      purpose, possession, furnishing, city, locality, sub_locality,
      state, pincode, address_line, landmark, price, price_per_sqft,
      formatted_price, formatted_price_per_sqft, maintenance_charges_monthly,
      is_price_negotiable, bedrooms, bathrooms, balconies, carpet_area_sqft,
      super_builtup_area_sqft, floor_number, floor_info, car_parking_slots,
      facing, rera_id, is_rera_approved, ownership_type, primary_image_url,
      additional_images, amenities, status, is_featured, is_top_of_search,
      has_whatsapp_direct, is_free_listing, free_until, listing_fee_per_day,
      priority_score, created_at, updated_at
    ) VALUES (
      $1::uuid, $2, $3, $4, $5::property_category, $6,
      $7::listing_purpose, $8::possession_status, $9::furnishing_status,
      $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
      $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
      $34, $35, $36, $37, $38::property_status, $39, $40, $41, $42,
      $43, $44, $45, now(), now()
    ) RETURNING id`,
    [
      user.id,
      title,
      slug,
      data.description || 'Verified property listing on BrokersBlitz.',
      cat,
      data.categoryLabel || `${data.bedrooms || 0} BHK`,
      purp,
      poss,
      furn,
      data.city || 'Mumbai',
      data.locality || '',
      data.locality || '',
      data.city || 'Maharashtra',
      data.pincode || '400001',
      data.address || `${data.locality || ''}, ${data.city || ''}`,
      data.landmark || '',
      price,
      pricePerSqft,
      formattedPrice,
      formattedPricePerSqft,
      Number(data.maintenanceMonthly) || 0,
      true,
      Number(data.bedrooms) || 0,
      Number(data.bathrooms) || 0,
      Number(data.balconies) || 0,
      carpetArea,
      Number(data.superBuiltupSqft) || Math.round(carpetArea * 1.3),
      0,
      data.floorInfo || 'Mid Floor',
      Number(data.carParking) || 0,
      data.facing || 'East',
      data.reraId || user.reraNumber || '',
      Boolean(data.isReraApproved),
      'Freehold',
      data.primaryImage || '',
      Array.isArray(data.additionalImages) ? data.additionalImages : [],
      Array.isArray(data.amenities) ? data.amenities : [],
      data.status || 'active',
      Boolean(data.isFeatured),
      Boolean(data.isTopSearch),
      true,
      Boolean(data.isFreeListing),
      data.freeUntil ? new Date(data.freeUntil) : null,
      Number(data.listingFeePerDay) || 2,
      Number(data.priorityScore) || 1000,
    ]
  );

  const createdId = res.rows[0].id;
  const prop = await getPropertyById(createdId);
  if (!prop) {
    throw new Error('Failed to retrieve newly created property');
  }
  return prop;
}

export async function updateProperty(id: string, updates: Partial<PropertyListing>): Promise<PropertyListing | null> {
  const current = await getPropertyById(id);
  if (!current) return null;

  const price = updates.price !== undefined ? Number(updates.price) : current.price;
  const formattedPrice = updates.price !== undefined ? formatPriceNumber(price) : current.formattedPrice;
  const status = updates.status || current.status;

  await query(
    `UPDATE public.properties SET
      title = coalesce($1, title),
      description = coalesce($2, description),
      price = $3,
      formatted_price = $4,
      status = $5::property_status,
      is_featured = coalesce($6, is_featured),
      is_top_of_search = coalesce($7, is_top_of_search),
      updated_at = now()
    WHERE id::text = $8`,
    [
      updates.title || null,
      updates.description || null,
      price,
      formattedPrice,
      status,
      updates.isFeatured !== undefined ? updates.isFeatured : null,
      updates.isTopSearch !== undefined ? updates.isTopSearch : null,
      id,
    ]
  );

  return getPropertyById(id);
}

export async function updatePropertyStatus(id: string, status: 'active' | 'paused' | 'sold' | 'expired'): Promise<PropertyListing | null> {
  return updateProperty(id, { status });
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const res = await query(`DELETE FROM public.properties WHERE id::text = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function searchProperties(filters: {
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
}): Promise<PropertyListing[]> {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.city && filters.city !== 'Pan India' && filters.city !== 'All India') {
      conditions.push(`lower(p.city) = lower($${idx})`);
      values.push(filters.city);
      idx++;
    }

    if (filters.purpose && filters.purpose !== 'all') {
      conditions.push(`p.purpose = $${idx}::listing_purpose`);
      values.push(filters.purpose);
      idx++;
    }

    if (filters.category && filters.category !== 'all') {
      conditions.push(`p.category = $${idx}::property_category`);
      values.push(filters.category);
      idx++;
    }

    if (filters.bhk && filters.bhk !== 'all') {
      if (filters.bhk === '4+') {
        conditions.push(`p.bedrooms >= 4`);
      } else {
        conditions.push(`p.bedrooms = $${idx}`);
        values.push(parseInt(filters.bhk, 10));
        idx++;
      }
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`p.price >= $${idx}`);
      values.push(filters.minPrice);
      idx++;
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`p.price <= $${idx}`);
      values.push(filters.maxPrice);
      idx++;
    }

    if (filters.reraOnly) {
      conditions.push(`p.is_rera_approved IS TRUE`);
    }

    if (filters.query && filters.query.trim()) {
      conditions.push(
        `(p.title ILIKE $${idx} OR p.locality ILIKE $${idx} OR p.city ILIKE $${idx} OR p.address_line ILIKE $${idx} OR pr.agency_name ILIKE $${idx} OR pr.full_name ILIKE $${idx})`
      );
      values.push(`%${filters.query.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await query(
      `${BASE_QUERY} ${whereClause} ORDER BY p.priority_score DESC, p.created_at DESC`,
      values
    );
    return res.rows.map(mapRowToProperty);
  } catch {
    return [];
  }
}

export async function saveProperties(properties: PropertyListing[]): Promise<void> {
  for (const p of properties) {
    try {
      await query(
        `UPDATE public.properties SET
          status = $1::property_status,
          priority_score = $2,
          is_free_listing = $3,
          listing_fee_per_day = $4,
          last_charged_at = $5,
          updated_at = now()
        WHERE id::text = $6`,
        [
          p.status,
          p.priorityScore || 1000,
          Boolean(p.isFreeListing),
          p.listingFeePerDay || 2,
          p.lastChargedAt ? new Date(p.lastChargedAt) : new Date(),
          p.id,
        ]
      );
    } catch {}
  }
}
