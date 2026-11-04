import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const translationCache = new Map<string, string>();
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

const offlinePhrases: Record<string, Record<string, string>> = {
  hi: {
    'apartment': 'फ्लैट',
    'flat': 'फ्लैट',
    'villa': 'विला',
    'penthouse': 'पेंटहाउस',
    'commercial office': 'कमर्शियल ऑफिस',
    'retail shop': 'दुकान',
    'plot': 'प्लॉट',
    'land': 'ज़मीन',
    'buy': 'खरीदें',
    'rent': 'किराया',
    'pan india': 'पूरा भारत',
    'ready to move': 'तुरंत रहने योग्य',
    'under construction': 'निर्माणाधीन',
    'furnished': 'सुसज्जित (फर्निश्ड)',
    'unfurnished': 'गैर-सुसज्जित (अनफर्निश्ड)',
    'semi-furnished': 'सेमी-फर्निश्ड',
    'rera approved': 'रेरा प्रमाणित',
    'site visit': 'साइट विज़िट',
  },
  hinglish: {
    'apartment': 'Apartment / Flat',
    'flat': 'Flat',
    'villa': 'Luxury Villa',
    'penthouse': 'Penthouse',
    'commercial office': 'Commercial Office',
    'retail shop': 'Shop / Retail',
    'plot': 'Plot',
    'land': 'Zameen / Land',
    'buy': 'Buy',
    'rent': 'Rent',
    'pan india': 'Pan India',
    'ready to move': 'Ready to Move',
    'under construction': 'Under Construction',
    'furnished': 'Furnished',
    'unfurnished': 'Unfurnished',
    'semi-furnished': 'Semi-Furnished',
    'rera approved': 'RERA Approved',
    'site visit': 'Site Visit',
  },
};

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const rateData = ipRequestCounts.get(ip) || { count: 0, resetAt: now + 60000 };

    if (now > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = now + 60000;
    }

    if (rateData.count >= 30) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    rateData.count += 1;
    ipRequestCounts.set(ip, rateData);

    const body = await req.json();
    const text = String(body.text || '').trim();
    const targetLang = String(body.targetLang || 'hi').toLowerCase();

    if (!text) {
      return NextResponse.json({ success: true, translation: '', source: 'empty' });
    }

    if (targetLang === 'en') {
      return NextResponse.json({ success: true, translation: text, source: 'identity' });
    }

    const sanitizedText = text.slice(0, 300);
    const cacheKey = `${targetLang}:${crypto.createHash('sha256').update(sanitizedText.toLowerCase()).digest('hex')}`;

    if (translationCache.has(cacheKey)) {
      return NextResponse.json({
        success: true,
        translation: translationCache.get(cacheKey)!,
        source: 'cache',
      });
    }

    const lower = sanitizedText.toLowerCase();
    if (offlinePhrases[targetLang] && offlinePhrases[targetLang][lower]) {
      const offlineResult = offlinePhrases[targetLang][lower];
      translationCache.set(cacheKey, offlineResult);
      return NextResponse.json({
        success: true,
        translation: offlineResult,
        source: 'dictionary',
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('placeholder')) {
      return NextResponse.json({
        success: true,
        translation: sanitizedText,
        source: 'fallback',
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                targetLang === 'hi'
                  ? 'You are an Indian real estate translation engine. Translate the following English real estate text accurately into natural Hindi in Devanagari script. Output only the translated text.'
                  : 'You are an Indian real estate translation engine. Translate the following English real estate text into natural colloquial Hinglish (popular Indian English-Hindi mix written in Latin alphabet, e.g., "3 BHK flat Carter Road pe available hai"). Output only the translated text.',
            },
            {
              role: 'user',
              content: sanitizedText,
            },
          ],
          max_tokens: 150,
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json({
          success: true,
          translation: sanitizedText,
          source: 'safe_offline_fallback',
        });
      }

      const data = await response.json();
      const translated = data.choices?.[0]?.message?.content?.trim();

      if (translated) {
        if (translationCache.size > 2000) {
          const firstKey = translationCache.keys().next().value;
          if (firstKey) translationCache.delete(firstKey);
        }
        translationCache.set(cacheKey, translated);
        return NextResponse.json({
          success: true,
          translation: translated,
          source: 'ai',
        });
      }
    } catch {
      clearTimeout(timeout);
    }

    return NextResponse.json({
      success: true,
      translation: sanitizedText,
      source: 'offline_default',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: true, translation: '', error: err?.message, source: 'error_fallback' },
      { status: 200 }
    );
  }
}

