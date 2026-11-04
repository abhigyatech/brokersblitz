import { PropertyListing } from '../../data/types';

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

export type ListingStep =
  | 'idle'
  | 'step1_intent'
  | 'step2_category'
  | 'step3_specs'
  | 'step4_city'
  | 'step4_locality'
  | 'step5_price'
  | 'step6_confirm'
  | 'voice_draft_confirm'
  | 'booking_visit'
  | 'searching_properties'
  | 'edit_draft_price'
  | 'edit_draft_bhk'
  | 'edit_draft_locality'
  | 'edit_draft_area'
  | 'buyer_step1_intent'
  | 'buyer_step2_state'
  | 'buyer_step2_city'
  | 'buyer_step2_locality'
  | 'buyer_step3_category'
  | 'buyer_step4_bhk'
  | 'buyer_step5_budget';

export interface BuyerSearchPreferences {
  purpose?: 'sale' | 'rent';
  state?: string;
  stateCode?: string;
  city?: string;
  locality?: string;
  category?: string;
  categoryLabel?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  budgetLabel?: string;
  lastSearchedAt?: string;
}

export interface DraftListingData {
  id?: string;
  title?: string;
  purpose?: 'sale' | 'rent';
  category?: string;
  categoryLabel?: string;
  bedrooms?: number;
  bathrooms?: number;
  carpetAreaSqft?: number;
  price?: number;
  city?: string;
  locality?: string;
  address?: string;
  floorInfo?: string;
  furnishing?: 'furnished' | 'semi_furnished' | 'unfurnished';
  amenities?: string[];
  description?: string;
  isNegotiable?: boolean;
  rawVoiceTranscript?: string;
  urgency?: string;
}

export interface WhatsAppUserSession {
  phone: string;
  role: 'buyer' | 'broker';
  brokerId?: string;
  brokerCode?: string;
  brokerName?: string;
  agencyName?: string;
  currentStep: ListingStep;
  draftListing?: DraftListingData;
  buyerPreferences?: BuyerSearchPreferences;
  activeDraftId?: string;
  lastActive: string;
}

export interface IncomingWhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'audio' | 'voice' | 'location' | 'unknown';
  text?: string;
  interactiveButtonId?: string;
  interactiveListId?: string;
  audioMediaId?: string;
  audioMimeType?: string;
  userName?: string;
}

