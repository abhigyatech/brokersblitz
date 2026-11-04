import { State, City } from 'country-state-city';

export interface IndianStateInfo {
  code: string;
  name: string;
  region: 'North' | 'West' | 'South' | 'East' | 'Central' | 'NorthEast';
  popularCities: string[];
}

export const POPULAR_INDIAN_STATES: IndianStateInfo[] = [
  {
    code: 'MH',
    name: 'Maharashtra',
    region: 'West',
    popularCities: ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai', 'Nagpur', 'Nashik'],
  },
  {
    code: 'KA',
    name: 'Karnataka',
    region: 'South',
    popularCities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
  },
  {
    code: 'DL',
    name: 'Delhi NCR',
    region: 'North',
    popularCities: ['Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Faridabad', 'Ghaziabad'],
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    region: 'Central',
    popularCities: ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain'],
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    region: 'West',
    popularCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  },
  {
    code: 'TG',
    name: 'Telangana',
    region: 'South',
    popularCities: ['Hyderabad', 'Warangal', 'Secunderabad', 'Nizamabad'],
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    region: 'North',
    popularCities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut'],
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    region: 'South',
    popularCities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    region: 'North',
    popularCities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer'],
  },
  {
    code: 'WB',
    name: 'West Bengal',
    region: 'East',
    popularCities: ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol'],
  },
];

const ALL_STATES_CACHE = State.getStatesOfCountry('IN');

export function getAllIndianStates(): { code: string; name: string }[] {
  return ALL_STATES_CACHE.map((s) => ({
    code: s.isoCode,
    name: s.name,
  }));
}

export function findStateByNameOrCode(query: string): IndianStateInfo | undefined {
  const q = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!q) return undefined;

  const popular = POPULAR_INDIAN_STATES.find(
    (s) =>
      s.code.toLowerCase() === q ||
      s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q ||
      s.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q)
  );
  if (popular) return popular;

  const found = ALL_STATES_CACHE.find(
    (s) =>
      s.isoCode.toLowerCase() === q ||
      s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q ||
      s.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q)
  );

  if (found) {
    const rawCities = City.getCitiesOfState('IN', found.isoCode).slice(0, 10).map((c) => c.name);
    return {
      code: found.isoCode,
      name: found.name,
      region: 'Central',
      popularCities: rawCities.length > 0 ? rawCities : [found.name],
    };
  }

  return undefined;
}

export function getCitiesForState(stateCode: string): string[] {
  const norm = stateCode.toUpperCase();
  const popular = POPULAR_INDIAN_STATES.find((s) => s.code === norm);
  if (popular && popular.popularCities.length > 0) {
    return popular.popularCities;
  }

  const cities = City.getCitiesOfState('IN', norm);
  if (cities && cities.length > 0) {
    return cities.slice(0, 10).map((c) => c.name);
  }

  return ['Central City'];
}

export function matchIndianCity(text: string): { city: string; state?: string } | null {
  const clean = text.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  for (const s of POPULAR_INDIAN_STATES) {
    for (const c of s.popularCities) {
      if (clean === c.toLowerCase() || clean.includes(c.toLowerCase())) {
        return { city: c, state: s.name };
      }
    }
  }

  const aliases: Record<string, { city: string; state: string }> = {
    blr: { city: 'Bengaluru', state: 'Karnataka' },
    bangalore: { city: 'Bengaluru', state: 'Karnataka' },
    bombay: { city: 'Mumbai', state: 'Maharashtra' },
    gurugram: { city: 'Gurgaon', state: 'Delhi NCR' },
    calcutta: { city: 'Kolkata', state: 'West Bengal' },
    madras: { city: 'Chennai', state: 'Tamil Nadu' },
    banaras: { city: 'Varanasi', state: 'Uttar Pradesh' },
    kashi: { city: 'Varanasi', state: 'Uttar Pradesh' },
    prayag: { city: 'Prayagraj', state: 'Uttar Pradesh' },
    allahabad: { city: 'Prayagraj', state: 'Uttar Pradesh' },
    baroda: { city: 'Vadodara', state: 'Gujarat' },
    cochin: { city: 'Kochi', state: 'Kerala' },
    trivandrum: { city: 'Thiruvananthapuram', state: 'Kerala' },
    vizag: { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  };

  for (const [alias, match] of Object.entries(aliases)) {
    if (clean === alias || clean.includes(alias)) {
      return match;
    }
  }

  for (const s of ALL_STATES_CACHE) {
    const stateCities = City.getCitiesOfState('IN', s.isoCode);
    const matched = stateCities.find((c) => c.name.toLowerCase() === clean);
    if (matched) {
      return { city: matched.name, state: s.name };
    }
  }

  return null;
}

