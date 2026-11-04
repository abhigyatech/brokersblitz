import { PropertyListing } from '../../data/types';
import { getAllProperties, saveProperties } from '../db/properties-store';
import { deductCredits, syncWalletBalances } from '../wallet/wallet-service';

export const FREE_LISTING_LIMIT = 5;
export const FREE_LISTING_DAYS = 15;
export const DAILY_LISTING_RATE = 2;

export function evaluateBrokerListingQuota(brokerId: string): {
  totalListings: number;
  activeListings: number;
  freeSlotsRemaining: number;
  isNextListingFree: boolean;
} {
  const properties = getAllProperties();
  const brokerProperties = properties.filter((p) => p.broker.id === brokerId);
  const total = brokerProperties.length;
  const active = brokerProperties.filter((p) => p.status === 'active').length;
  const freeUsed = brokerProperties.filter((p) => p.isFreeListing).length;
  const remaining = Math.max(0, FREE_LISTING_LIMIT - freeUsed);

  return {
    totalListings: total,
    activeListings: active,
    freeSlotsRemaining: remaining,
    isNextListingFree: remaining > 0,
  };
}

export async function processListingOnCreation(
  property: PropertyListing,
  brokerId: string
): Promise<PropertyListing> {
  const quota = evaluateBrokerListingQuota(brokerId);

  if (quota.isNextListingFree) {
    const freeUntil = new Date(Date.now() + FREE_LISTING_DAYS * 86400000).toISOString();
    property.isFreeListing = true;
    property.freeUntil = freeUntil;
    property.listingFeePerDay = DAILY_LISTING_RATE;
    property.status = 'active';
    property.lastChargedAt = new Date().toISOString();
  } else {
    property.isFreeListing = false;
    property.listingFeePerDay = DAILY_LISTING_RATE;

    try {
      await deductCredits(
        brokerId,
        DAILY_LISTING_RATE,
        'LISTING_ACTIVE_CHARGE',
        `Day 1 active listing fee (2 credits/day) - ${property.title}`,
        { propertyId: property.id }
      );
      property.status = 'active';
      property.lastChargedAt = new Date().toISOString();
    } catch {
      property.status = 'paused';
      property.expiredReason = 'Insufficient credits. 2 credits required to activate listings beyond first 5.';
    }
  }

  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === property.id);
  if (idx >= 0) {
    all[idx] = property;
    saveProperties(all);
  }

  return property;
}

export async function syncDailyListingDeductions(): Promise<{
  activeChecked: number;
  chargedCount: number;
  expiredCount: number;
  creditsDeducted: number;
}> {
  const properties = getAllProperties();
  let chargedCount = 0;
  let expiredCount = 0;
  let creditsDeducted = 0;
  const now = Date.now();
  let hasModifications = false;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];

    if (!prop.status || prop.status === 'sold' || prop.status === 'paused' || prop.status === 'expired') {
      continue;
    }

    if (prop.isFreeListing && prop.freeUntil) {
      if (new Date(prop.freeUntil).getTime() > now) {
        continue;
      }
      prop.isFreeListing = false;
      hasModifications = true;
    }

    const baselineDate = prop.lastChargedAt
      ? new Date(prop.lastChargedAt).getTime()
      : prop.freeUntil
      ? new Date(prop.freeUntil).getTime()
      : new Date(prop.createdAt).getTime();

    const daysElapsed = Math.floor((now - baselineDate) / 86400000);

    if (daysElapsed >= 1) {
      const chargeUnits = Math.min(daysElapsed, 7);
      const feeDue = chargeUnits * DAILY_LISTING_RATE;

      try {
        await deductCredits(
          prop.broker.id,
          feeDue,
          'LISTING_ACTIVE_CHARGE',
          `Daily active listing fee (${chargeUnits} day${chargeUnits > 1 ? 's' : ''} @ 2 credits/day) - ${prop.title}`,
          { propertyId: prop.id, days: chargeUnits }
        );
        prop.lastChargedAt = new Date().toISOString();
        chargedCount += 1;
        creditsDeducted += feeDue;
        hasModifications = true;
      } catch {
        prop.status = 'expired';
        prop.expiredAt = new Date().toISOString();
        prop.expiredReason = 'Listing automatically paused due to zero or insufficient wallet credits for daily active charge (2 credits/day).';
        expiredCount += 1;
        hasModifications = true;
      }
    }
  }

  if (hasModifications) {
    saveProperties(properties);
  }

  return {
    activeChecked: properties.filter((p) => p.status === 'active').length,
    chargedCount,
    expiredCount,
    creditsDeducted,
  };
}

export function markListingAsSold(propertyId: string, brokerId: string): {
  success: boolean;
  property?: PropertyListing;
  error?: string;
} {
  const properties = getAllProperties();
  const idx = properties.findIndex((p) => p.id === propertyId);

  if (idx === -1) {
    return { success: false, error: 'Property not found' };
  }

  const prop = properties[idx];
  if (prop.broker.id !== brokerId) {
    return { success: false, error: 'Unauthorized to modify this property' };
  }

  prop.status = 'sold';
  prop.soldAt = new Date().toISOString();
  saveProperties(properties);

  return { success: true, property: prop };
}

export async function reactivateListing(propertyId: string, brokerId: string): Promise<{
  success: boolean;
  property?: PropertyListing;
  error?: string;
}> {
  const properties = getAllProperties();
  const idx = properties.findIndex((p) => p.id === propertyId);

  if (idx === -1) {
    return { success: false, error: 'Property not found' };
  }

  const prop = properties[idx];
  if (prop.broker.id !== brokerId) {
    return { success: false, error: 'Unauthorized to modify this property' };
  }

  try {
    await deductCredits(
      brokerId,
      DAILY_LISTING_RATE,
      'LISTING_ACTIVE_CHARGE',
      `Reactivation fee (2 credits/day) - ${prop.title}`,
      { propertyId: prop.id }
    );

    prop.status = 'active';
    prop.isFreeListing = false;
    prop.lastChargedAt = new Date().toISOString();
    delete prop.expiredAt;
    delete prop.expiredReason;
    saveProperties(properties);

    return { success: true, property: prop };
  } catch (err: any) {
    return { success: false, error: err.message || 'Insufficient wallet credits to reactivate listing (2 credits required).' };
  }
}

export function calculateListingPriorityScore(property: PropertyListing): number {
  let score = 0;

  if (property.status === 'active') {
    score += 500;
  } else if (property.status === 'sold') {
    score += 50;
  } else {
    score -= 1000;
  }

  if (property.isFeatured) score += 300;
  if (property.status === 'active' && !property.isFreeListing) score += 150;
  if (property.status === 'active' && property.isFreeListing) score += 100;

  if (property.broker.isReraVerified) score += 60;
  score += Math.round((property.broker.rating || 4.5) * 15);

  if (property.primaryImage) score += 30;
  if (property.additionalImages && property.additionalImages.length >= 3) score += 30;
  if (property.carpetAreaSqft > 0) score += 20;
  if (property.amenities && property.amenities.length >= 4) score += 20;

  const ageHours = Math.max(0, (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60));
  score += Math.max(0, 50 - Math.round(ageHours / 24));

  return score;
}

export function interleaveAndPrioritizeListings(listings: PropertyListing[]): PropertyListing[] {
  const scored = listings.map((p) => {
    p.priorityScore = calculateListingPriorityScore(p);
    return p;
  });

  const active = scored.filter((p) => p.status === 'active');
  const sold = scored.filter((p) => p.status === 'sold');

  const brokerGroups: Record<string, PropertyListing[]> = {};
  for (const item of active) {
    const bId = item.broker.id || item.broker.storeCode || item.broker.name;
    if (!brokerGroups[bId]) brokerGroups[bId] = [];
    brokerGroups[bId].push(item);
  }

  for (const bId in brokerGroups) {
    brokerGroups[bId].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }

  const interleavedActive: PropertyListing[] = [];
  let hasMore = true;
  let round = 0;

  const brokerKeys = Object.keys(brokerGroups).sort((a, b) => {
    const topA = brokerGroups[a][0]?.priorityScore || 0;
    const topB = brokerGroups[b][0]?.priorityScore || 0;
    return topB - topA;
  });

  while (hasMore) {
    hasMore = false;
    for (const bId of brokerKeys) {
      if (round < brokerGroups[bId].length) {
        interleavedActive.push(brokerGroups[bId][round]);
        hasMore = true;
      }
    }
    round += 1;
  }

  sold.sort((a, b) => {
    const dateA = a.soldAt ? new Date(a.soldAt).getTime() : 0;
    const dateB = b.soldAt ? new Date(b.soldAt).getTime() : 0;
    return dateB - dateA;
  });

  return [...interleavedActive, ...sold];
}

