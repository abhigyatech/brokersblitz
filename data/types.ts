export type UserRole = 'buyer' | 'broker' | 'admin';

export type PropertyCategory = 
  | 'apartment'
  | 'villa'
  | 'penthouse'
  | 'independent_house'
  | 'commercial_office'
  | 'retail_shop'
  | 'commercial_shop'
  | 'builder_floor'
  | 'industrial_warehouse'
  | 'residential_plot'
  | 'agricultural_land';

export type ListingPurpose = 'sale' | 'rent' | 'lease';

export type PossessionStatus = 
  | 'ready_to_move'
  | 'under_construction'
  | 'resale'
  | 'new_launch';

export type FurnishingStatus = 
  | 'unfurnished'
  | 'semi_furnished'
  | 'fully_furnished'
  | 'bare_shell';

export interface BrokerInfo {
  id: string;
  name: string;
  storeCode: string;
  agency: string;
  phone?: string;
  whatsapp?: string;
  reraNumber: string;
  isReraVerified: boolean;
  avatar: string;
  experienceYears: number;
  totalListings: number;
  rating: number;
  responseTime: string;
  bio?: string;
  city?: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  slug: string;
  category: PropertyCategory;
  categoryLabel: string;
  purpose: ListingPurpose;
  price: number;
  formattedPrice: string;
  pricePerSqft: number;
  formattedPricePerSqft: string;
  maintenanceMonthly?: number;
  
  city: string;
  locality: string;
  subLocality?: string;
  address: string;
  landmark: string;
  pincode: string;
  
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  carpetAreaSqft: number;
  superBuiltupSqft?: number;
  furnishing: FurnishingStatus;
  possession: PossessionStatus;
  floorInfo?: string;
  carParking: number;
  facing?: string;
  
  reraId: string;
  isReraApproved: boolean;
  isFeatured: boolean;
  isTopSearch: boolean;
  isUrgentDeal?: boolean;
  
  primaryImage: string;
  additionalImages: string[];
  amenities: string[];
  description: string;
  
  dailyRate?: number;
  activeDaysRemaining?: number;
  listingTier?: string;
  
  viewsCount: number;
  leadsCount: number;
  status?: 'active' | 'paused' | 'sold';
  broker: BrokerInfo;
  createdAt: string;
}

export interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice?: string;
  brokerId: string;
  brokerStoreCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  message: string;
  preferredDate?: string;
  timeSlot?: string;
  source: 'blitzbot' | 'whatsapp' | 'web';
  status: 'new' | 'confirmed' | 'rescheduled' | 'cancelled';
  createdAt: string;
}

export interface CityMetric {
  name: string;
  state: string;
  slug: string;
  activeListingsCount: number;
  averagePricePerSqft: string;
  popularLocalities: string[];
  isMetro: boolean;
}
