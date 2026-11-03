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

