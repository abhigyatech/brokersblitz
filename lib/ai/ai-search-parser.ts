export interface ParsedSearchFilters {
  city?: string;
  category?: string;
  purpose?: 'sale' | 'rent';
  locality?: string;
  bhk?: string;
  minPrice?: number;
  maxPrice?: number;
  brokerKeyword?: string;
  detectedIntent: 'search' | 'list_property' | 'visit' | 'broker_search' | 'general';
}

export function parseNaturalLanguageQuery(query: string): ParsedSearchFilters {
  const q = query.toLowerCase().trim();
  const filters: ParsedSearchFilters = {
    detectedIntent: 'search',
  };

  if (q.includes('list') || q.includes('post') || q.includes('sell my')) {
    filters.detectedIntent = 'list_property';
  } else if (q.includes('visit') || q.includes('tour') || q.includes('inspect')) {
    filters.detectedIntent = 'visit';
  } else if (q.includes('broker') || q.includes('agent') || q.includes('store') || q.includes('consultant')) {
    filters.detectedIntent = 'broker_search';
  }

  const brokerNames = [
    'rajesh', 'apex', 'ananya', 'deccan', 'vikram', 'capital corridors',
    'suresh', 'sahyadri', 'venkat', 'cyberabad', 'maria', 'goa coastal',
    'arun', 'coromandel'
  ];
  for (const bName of brokerNames) {
    if (q.includes(bName)) {
      filters.brokerKeyword = bName;
      filters.detectedIntent = 'broker_search';
      break;
    }
  }

  if (q.includes('mumbai') || q.includes('bandra') || q.includes('worli') || q.includes('juhu') || q.includes('andheri')) {
    filters.city = 'Mumbai';
  } else if (q.includes('bengaluru') || q.includes('bangalore') || q.includes('whitefield') || q.includes('indiranagar') || q.includes('koramangala')) {
    filters.city = 'Bengaluru';
  } else if (q.includes('delhi') || q.includes('gurgaon') || q.includes('gurugram') || q.includes('noida') || q.includes('ncr')) {
    filters.city = 'Delhi NCR';
  } else if (q.includes('pune') || q.includes('baner') || q.includes('wakad') || q.includes('kothrud') || q.includes('hinjewadi')) {
    filters.city = 'Pune';
  } else if (q.includes('hyderabad') || q.includes('kokapet') || q.includes('gachibowli') || q.includes('hitec') || q.includes('jubilee')) {
    filters.city = 'Hyderabad';
  } else if (q.includes('goa') || q.includes('assagao') || q.includes('anjuna') || q.includes('panaji') || q.includes('siolim')) {
    filters.city = 'Goa';
  } else if (q.includes('chennai') || q.includes('ecr') || q.includes('omr') || q.includes('adyar') || q.includes('anna nagar')) {
    filters.city = 'Chennai';
  }

  const knownLocalities = [
    'bandra west', 'bandra', 'worli', 'whitefield', 'indiranagar',
    'golf course road', 'cyber city', 'baner', 'kokapet', 'assagao',
    'east coast road', 'ecr', 'vijay nagar', 'koramangala', 'hinjewadi',
    'juhu', 'andheri', 'gachibowli', 'jubilee hills', 'siolim', 'omr'
  ];
  for (const loc of knownLocalities) {
    if (q.includes(loc)) {
      filters.locality = loc;
      break;
    }
  }

  if (!filters.locality) {
    const locPattern = /\b(?:in|at|near|around)\s+([a-zA-Z0-9\s]{2,25}?)(?:\s+(?:under|below|for|within|above|flat|apartment|villa|house|bhk|with|having)|$)/i;
    const match = query.match(locPattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (!['mumbai', 'delhi', 'pune', 'goa', 'chennai', 'hyderabad', 'bengaluru', 'bangalore'].includes(candidate.toLowerCase())) {
        filters.locality = candidate;
      }
    }
  }

  if (q.includes('rent') || q.includes('lease') || q.includes('for rent')) {
    filters.purpose = 'rent';
  } else if (q.includes('buy') || q.includes('purchase') || q.includes('sale') || q.includes('for sale')) {
    filters.purpose = 'sale';
  }

  if (q.includes('penthouse')) {
    filters.category = 'penthouse';
  } else if (q.includes('villa')) {
    filters.category = 'villa';
  } else if (q.includes('office') || q.includes('commercial') || q.includes('it park') || q.includes('workstation')) {
    filters.category = 'commercial_office';
  } else if (q.includes('shop') || q.includes('retail') || q.includes('showroom')) {
    filters.category = 'retail_shop';
  } else if (q.includes('plot') || q.includes('land') || q.includes('zameen')) {
    filters.category = 'residential_plot';
  } else if (q.includes('warehouse') || q.includes('logistics') || q.includes('godown')) {
    filters.category = 'industrial_warehouse';
  } else if (q.includes('flat') || q.includes('apartment')) {
    filters.category = 'apartment';
  }

  if (q.includes('1 bhk') || q.includes('1bhk')) filters.bhk = '1';
  else if (q.includes('2 bhk') || q.includes('2bhk')) filters.bhk = '2';
  else if (q.includes('3 bhk') || q.includes('3bhk')) filters.bhk = '3';
  else if (q.includes('4 bhk') || q.includes('4bhk') || q.includes('5 bhk')) filters.bhk = '4';

  const crMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/);
  if (crMatch) {
    const val = parseFloat(crMatch[1]) * 10000000;
    if (q.includes('under') || q.includes('below') || q.includes('within') || q.includes('upto') || q.includes('up to')) {
      filters.maxPrice = val;
    } else if (q.includes('above') || q.includes('min') || q.includes('minimum')) {
      filters.minPrice = val;
    } else {
      filters.maxPrice = val * 1.15;
      filters.minPrice = val * 0.85;
    }
  }

  const lakhMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]) * 100000;
    if (q.includes('under') || q.includes('below') || q.includes('upto')) {
      filters.maxPrice = val;
    } else {
      filters.maxPrice = val;
    }
  }

  return filters;
}

export async function parseQueryWithOpenAI(query: string, apiKey: string): Promise<ParsedSearchFilters | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an Indian Real Estate Search Query Parser. Extract search criteria from the user's natural query into JSON format. Valid fields:
city: string (e.g. "Mumbai", "Bengaluru", "Delhi NCR", "Pune", "Hyderabad", "Goa", "Chennai")
category: string ("apartment", "villa", "penthouse", "commercial_office", "retail_shop", "residential_plot", "industrial_warehouse")
purpose: string ("sale", "rent")
locality: string
bhk: string ("1", "2", "3", "4")
minPrice: number in INR
maxPrice: number in INR
brokerKeyword: string
Return strictly valid JSON only.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as ParsedSearchFilters;
  } catch {
    return null;
  }
}
