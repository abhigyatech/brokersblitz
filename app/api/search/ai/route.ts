import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery, parseQueryWithOpenAI } from '@/lib/ai/ai-search-parser';
import { getAllProperties, searchProperties } from '@/lib/db/properties-store';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    let parsed = parseNaturalLanguageQuery(query);
    const openAiKey = process.env.OPENAI_API_KEY;

    if (openAiKey) {
      const aiParsed = await parseQueryWithOpenAI(query, openAiKey);
      if (aiParsed) {
        parsed = { ...parsed, ...aiParsed };
      }
    }

    let results = searchProperties({
      city: parsed.city,
      category: parsed.category,
      purpose: parsed.purpose,
      bhk: parsed.bhk,
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
      query: parsed.locality || (!parsed.city && !parsed.category ? query : undefined),
    });

    if (results.length === 0 && (parsed.city || parsed.category)) {
      results = searchProperties({
        city: parsed.city,
        category: parsed.category,
      });
    }

    return NextResponse.json({
      success: true,
      parsed,
      results,
      count: results.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

