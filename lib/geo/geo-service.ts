import { Country, State, City, IState, ICity } from 'country-state-city';
import { PropertyListing } from '@/data/types';

export interface TerritoryState {
  code: string;
  name: string;
  countryCode: string;
}

export interface TerritoryCity {
  name: string;
  stateCode: string;
  countryCode: string;
  latitude?: string;
  longitude?: string;
}

export interface ListingCityMetric {
  name: string;
  slug: string;
  state: string;
  count: number;
}

export function getAllIndianStates(): TerritoryState[] {
  const states = State.getStatesOfCountry('IN');
  return states.map((s) => ({
    code: s.isoCode,
    name: s.name,
    countryCode: s.countryCode,
  }));
}

export function getCitiesByStateCode(stateCode: string): TerritoryCity[] {
  const cities = City.getCitiesOfState('IN', stateCode);
  return cities.map((c) => ({
    name: c.name,
    stateCode: c.stateCode,
    countryCode: c.countryCode,
    latitude: c.latitude || undefined,
    longitude: c.longitude || undefined,
  }));
}

export function searchIndianCities(query: string, limit: number = 20): TerritoryCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = City.getCitiesOfCountry('IN') || [];
  const matched: TerritoryCity[] = [];
  for (const c of all) {
    if (c.name.toLowerCase().includes(q)) {
      matched.push({
        name: c.name,
        stateCode: c.stateCode,
        countryCode: c.countryCode,
      });
      if (matched.length >= limit) break;
    }
  }
  return matched;
}

export function getListingLocations(properties: PropertyListing[]): ListingCityMetric[] {
  const cityCountMap: Record<string, { count: number; state: string }> = {};

  properties.forEach((p) => {
    if (!p.city) return;
    const norm = p.city.trim();
    if (!cityCountMap[norm]) {
      cityCountMap[norm] = {
        count: 1,
        state: findStateNameForCity(norm),
      };
    } else {
      cityCountMap[norm].count += 1;
    }
  });

  return Object.entries(cityCountMap).map(([cityName, data]) => ({
    name: cityName,
    slug: cityName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    state: data.state,
    count: data.count,
  }));
}

export function findStateNameForCity(cityName: string): string {
  const all = City.getCitiesOfCountry('IN') || [];
  const c = all.find((item) => item.name.toLowerCase() === cityName.toLowerCase());
  if (c && c.stateCode) {
    const s = State.getStateByCodeAndCountry(c.stateCode, 'IN');
    if (s) return s.name;
  }
  return 'India';
}

