import { NextRequest, NextResponse } from 'next/server';
import { generatePlatformCorpus, fetchOpenAIEmbedding } from '@/lib/ai/embedding-service';

export async function POST(req: NextRequest) {
  try {
    const corpus = generatePlatformCorpus();
    const openAiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let embeddedCount = 0;
    let syncedToSupabase = false;

    if (openAiKey && supabaseUrl && supabaseKey && !supabaseKey.includes('placeholder')) {
      for (const item of corpus) {
        const embedding = await fetchOpenAIEmbedding(`${item.title}\n${item.content}`, openAiKey);
        if (embedding) {
          item.embedding = embedding;
          embeddedCount++;

          try {
            await fetch(`${supabaseUrl}/rest/v1/platform_embeddings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify({
                entity_type: item.entityType,
                entity_id: item.entityId,
                title: item.title,
                content: item.content,
                metadata: item.metadata,
                embedding: item.embedding,
                updated_at: new Date().toISOString(),
              }),
            });
            syncedToSupabase = true;
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated platform corpus with ${corpus.length} knowledge chunks.`,
      totalChunks: corpus.length,
      embeddedCount,
      syncedToSupabase,
      summary: {
        properties: corpus.filter((c) => c.entityType === 'property').length,
        brokers: corpus.filter((c) => c.entityType === 'broker').length,
        knowledge: corpus.filter((c) => c.entityType === 'faq_knowledge').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const corpus = generatePlatformCorpus();
  return NextResponse.json({
    success: true,
    totalChunks: corpus.length,
    chunks: corpus.map((c) => ({
      id: c.id,
      entityType: c.entityType,
      entityId: c.entityId,
      title: c.title,
      contentSnippet: c.content.slice(0, 150) + '...',
      metadata: c.metadata,
    })),
  });
}

