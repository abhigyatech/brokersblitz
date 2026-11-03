import { CityMetric } from './types';
import { State } from 'country-state-city';

export const INDIAN_METROS: CityMetric[] = [
  {
    name: 'Pan India',
    state: 'National',
    slug: 'pan-india',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: [],
    isMetro: true,
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    slug: 'mumbai',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: ['Bandra West', 'Worli', 'Andheri West', 'Juhu', 'Powai', 'Thane'],
    isMetro: true,
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    slug: 'bengaluru',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: ['Whitefield', 'Indiranagar', 'Koramangala', 'Hebbal', 'Sarjapur Road'],
    isMetro: true,
  },
  {
    name: 'Delhi NCR',
    state: 'Delhi',
    slug: 'delhi-ncr',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: ['Golf Course Road', 'Cyber Hub', 'Sector 150 Noida', 'Connaught Place'],
    isMetro: true,
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    slug: 'pune',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: ['Baner', 'Koregaon Park', 'Hinjewadi', 'Kalyani Nagar', 'Wakad'],
    isMetro: true,
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    slug: 'hyderabad',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: ['HITEC City', 'Financial District', 'Jubilee Hills', 'Gachibowli'],
    isMetro: true,
  },
  {
    name: 'Goa',
    state: 'Goa',
    slug: 'goa',
    activeListingsCount: 0,
    averagePricePerSqft: 'Market Rate',
    popularLocalities: ['Assagao', 'Anjuna', 'Candolim', 'Porvorim'],
    isMetro: false,
  },
];

export const PROPERTY_TYPES = [
  { value: 'all', label: 'All Property Kinds' },
  { value: 'apartment', label: 'Flats / Apartments' },
  { value: 'villa', label: 'Kothis / Independent Houses' },
  { value: 'penthouse', label: 'Luxury Penthouses' },
  { value: 'commercial_office', label: 'Commercial Office Spaces' },
  { value: 'retail_shop', label: 'Dukaans / Retail Shops' },
  { value: 'residential_plot', label: 'Residential Plots / Zameen' },
  { value: 'industrial_warehouse', label: 'Godowns / Warehouses' },
  { value: 'agricultural_land', label: 'Farm Land / Agriculture' },
];

export const BUDGET_RANGES = [
  { value: 'all', label: 'Any Budget' },
  { value: '0-5000000', label: 'Under ₹50 Lakh' },
  { value: '5000000-10000000', label: '₹50 Lakh - ₹1 Cr' },
  { value: '10000000-30000000', label: '₹1 Cr - ₹3 Cr' },
  { value: '30000000-100000000', label: '₹3 Cr - ₹10 Cr' },
  { value: '100000000+', label: '₹10 Cr+' },
];

export const BHK_OPTIONS = [
  { value: 'all', label: 'All BHKs' },
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4+ BHK' },
];
