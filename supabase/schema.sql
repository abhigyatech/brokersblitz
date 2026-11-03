-- ==============================================================================
-- BrokersBlitz - Production PostgreSQL Database Schema for Supabase
-- Target DB: postgresql://postgres.xlyyctbdyjbqyxlmfpei:BrokersBlitz2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS & DOMAIN TYPES
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('buyer', 'broker', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_category AS ENUM (
        'apartment',
        'villa',
        'penthouse',
        'independent_house',
        'commercial_office',
        'retail_shop',
        'industrial_warehouse',
        'residential_plot',
        'agricultural_land'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_purpose AS ENUM ('sale', 'rent', 'lease');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE possession_status AS ENUM (
        'ready_to_move',
        'under_construction',
        'resale',
        'new_launch'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE furnishing_status AS ENUM (
        'unfurnished',
        'semi_furnished',
        'fully_furnished',
        'bare_shell'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM (
        'draft',
        'active',
        'paused',
        'expired',
        'sold',
        'under_verification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'wallet_topup',
        'daily_listing_charge',
        'addon_charge',
        'refund',
        'referral_bonus'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM (
        'new',
        'contacted',
        'site_visit_scheduled',
        'negotiation',
        'closed_won',
        'closed_lost'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. USERS & PROFILES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) in Supabase Auth
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'buyer',
    avatar_url TEXT,
    
    -- Broker Specific Verification & Agency Details
    rera_number VARCHAR(100),
    rera_state VARCHAR(50),
    agency_name VARCHAR(200),
    agency_logo_url TEXT,
    city_of_operation VARCHAR(100),
    is_rera_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    
    -- Financials for Pay-As-You-Go Listing
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    auto_recharge_enabled BOOLEAN DEFAULT FALSE,
    auto_recharge_threshold NUMERIC(10, 2) DEFAULT 100.00,
    auto_recharge_amount NUMERIC(10, 2) DEFAULT 500.00,
    
    -- Reputation & Metadata
    total_deals_closed INT DEFAULT 0,
    experience_years INT DEFAULT 1,
    rating NUMERIC(3, 2) DEFAULT 4.85,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 3. PROPERTIES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE,
    description TEXT NOT NULL,
    
    -- Categorization & Nature
    category property_category NOT NULL,
    purpose listing_purpose NOT NULL DEFAULT 'sale',
    possession possession_status NOT NULL DEFAULT 'ready_to_move',
    furnishing furnishing_status NOT NULL DEFAULT 'unfurnished',
    
    -- Location Details (India Specific)
    city VARCHAR(100) NOT NULL,
    locality VARCHAR(150) NOT NULL,
    sub_locality VARCHAR(150),
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    address_line TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    landmark VARCHAR(200),
    
    -- Pricing Structure
    price NUMERIC(14, 2) NOT NULL, -- Total price in INR
    price_per_sqft NUMERIC(10, 2),
    maintenance_charges_monthly NUMERIC(10, 2) DEFAULT 0.00,
    is_price_negotiable BOOLEAN DEFAULT TRUE,
    
    -- Property Dimensions & Configuration
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 0,
    balconies INT DEFAULT 0,
    carpet_area_sqft NUMERIC(10, 2) NOT NULL,
    super_builtup_area_sqft NUMERIC(10, 2),
    plot_area_sqyd NUMERIC(10, 2),
    floor_number INT DEFAULT 0,
    total_floors INT DEFAULT 1,
    facing VARCHAR(30), -- 'East', 'North-East', etc.
    car_parking_slots INT DEFAULT 1,
    
    -- Trust & Compliance
    rera_id VARCHAR(100),
    is_rera_approved BOOLEAN DEFAULT FALSE,
    ownership_type VARCHAR(50) DEFAULT 'Freehold',
    age_of_property_years INT DEFAULT 0,
    
    -- Rich Media & Features
    primary_image_url TEXT NOT NULL,
    additional_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    floor_plan_url TEXT,
    video_tour_url TEXT,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Pay-As-You-Go Listing Engine Tracking
    status property_status NOT NULL DEFAULT 'active',
    daily_base_rate NUMERIC(8, 2) NOT NULL DEFAULT 29.00, -- Base INR per day
    daily_addons_rate NUMERIC(8, 2) NOT NULL DEFAULT 0.00, -- Sum of active addon rates
    total_daily_rate NUMERIC(8, 2) GENERATED ALWAYS AS (daily_base_rate + daily_addons_rate) STORED,
    
    is_featured BOOLEAN DEFAULT FALSE,
    is_top_of_search BOOLEAN DEFAULT FALSE,
    has_whatsapp_direct BOOLEAN DEFAULT TRUE,
    is_urgent_sale BOOLEAN DEFAULT FALSE,
    
    listing_started_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    listing_expires_at TIMESTAMPTZ,
    auto_renew_daily BOOLEAN DEFAULT TRUE,
    days_listed_total INT DEFAULT 0,
    
    -- Stats
    view_count INT DEFAULT 0,
    lead_count INT DEFAULT 0,
    whatsapp_click_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 4. PAY-AS-YOU-GO LISTING SUBSCRIPTIONS & DAILY LEDGER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.listing_daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    billed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    base_charge NUMERIC(8, 2) NOT NULL,
    addons_charge NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    total_deducted NUMERIC(8, 2) NOT NULL,
    wallet_balance_after NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed_insufficient_funds'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(property_id, billed_date)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL, -- Positive for credits/top-ups, negative for debits
    type transaction_type NOT NULL,
    payment_gateway VARCHAR(50), -- 'Razorpay', 'Cashfree', 'UPI', 'Blitz_Credits'
    gateway_transaction_id VARCHAR(150),
    description TEXT NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 5. LEADS & BUYER INQUIRIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    buyer_name VARCHAR(150) NOT NULL,
    buyer_phone VARCHAR(20) NOT NULL,
    buyer_email VARCHAR(255),
    message TEXT,
    preferred_visit_date DATE,
    source VARCHAR(50) DEFAULT 'web_listing_card', -- 'web_listing_card', 'whatsapp_cta', 'call_now'
    status lead_status NOT NULL DEFAULT 'new',
    broker_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 6. SAVED FAVORITES (BUYER WISHLIST)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, property_id)
);

-- ==============================================================================
-- 7. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_city_locality ON public.properties(city, locality);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON public.properties(purpose);
CREATE INDEX IF NOT EXISTS idx_properties_broker_id ON public.properties(broker_id);
CREATE INDEX IF NOT EXISTS idx_leads_broker_id ON public.leads(broker_id);
CREATE INDEX IF NOT EXISTS idx_wallet_broker_id ON public.wallet_transactions(broker_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view verified broker summaries; Users manage own profile
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = auth_user_id);

-- Properties: Public can view active properties; Brokers manage own listings
CREATE POLICY "Active properties are viewable by everyone" 
    ON public.properties FOR SELECT USING (status = 'active');

CREATE POLICY "Brokers can view all their own properties regardless of status" 
    ON public.properties FOR SELECT 
    USING (broker_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Brokers can insert their own properties" 
    ON public.properties FOR INSERT 
    WITH CHECK (broker_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Brokers can update their own properties" 
    ON public.properties FOR UPDATE 
    USING (broker_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Leads: Brokers see leads for their properties; Buyers see leads they sent
CREATE POLICY "Brokers see leads on their properties"
    ON public.leads FOR SELECT
    USING (broker_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can create a lead inquiry"
    ON public.leads FOR INSERT
    WITH CHECK (true);

-- Wallet: Strictly private to the broker and platform admins
CREATE POLICY "Brokers can view their own wallet transactions"
    ON public.wallet_transactions FOR SELECT
    USING (broker_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ==============================================================================
-- 9. AI VECTOR EMBEDDINGS & SEMANTIC SEARCH (SUPABASE & OPENAI)
-- ==============================================================================

-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store high-dimensional embeddings for properties, broker profiles, localities, and knowledge base
CREATE TABLE IF NOT EXISTS platform_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'property', 'broker', 'locality', 'faq_knowledge'
    entity_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536), -- text-embedding-3-small (1536 dims) or text-embedding-ada-002
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lightning-fast approximate nearest neighbor cosine distance search
CREATE INDEX IF NOT EXISTS platform_embeddings_cosine_idx 
ON platform_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Match function to retrieve semantically similar items for AI bot and natural language search
CREATE OR REPLACE FUNCTION match_platform_embeddings(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 5,
    filter_entity_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.id,
        pe.entity_type,
        pe.entity_id,
        pe.title,
        pe.content,
        pe.metadata,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM platform_embeddings pe
    WHERE (filter_entity_type IS NULL OR pe.entity_type = filter_entity_type)
      AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
