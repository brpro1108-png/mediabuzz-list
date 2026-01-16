import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.darkiworld.com/';

interface MediaItem {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: 'movie' | 'series' | 'anime' | 'documentary';
  description?: string;
  popularity?: number;
  genres?: string[];
}

async function fetchDarkiWorldData(endpoint: string): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const html = await response.text();
  
  // Extract JSON data from HTML (same logic as Python code)
  let jsonData = null;
  
  // Try to find data in the format "data": [...] ,"loader":
  const dataMatch = html.match(/"data":(\[[\s\S]*?\]),"loader":/);
  if (dataMatch) {
    try {
      jsonData = JSON.parse(dataMatch[1]);
    } catch (e) {
      console.log('Failed to parse data match');
    }
  }
  
  // Try alternative format for search results
  if (!jsonData) {
    const searchMatch = html.match(/"searchPage":\s*\{[\s\S]*?"results":(\[[\s\S]*?\])/);
    if (searchMatch) {
      try {
        jsonData = JSON.parse(searchMatch[1]);
      } catch (e) {
        console.log('Failed to parse search match');
      }
    }
  }

  return jsonData || [];
}

function transformMediaItem(item: any, defaultType: string): MediaItem | null {
  if (!item || !item.id) return null;
  
  const isSeries = item.is_series === true;
  let type: 'movie' | 'series' | 'anime' | 'documentary' = 'movie';
  
  const itemType = item.type || (item.categorie?.model);
  
  if (itemType === 'animes' || itemType === 'anime') {
    type = isSeries ? 'anime' : 'movie';
  } else if (itemType === 'doc' || itemType === 'docs') {
    type = 'documentary';
  } else if (itemType === 'series' || isSeries) {
    type = 'series';
  } else if (itemType === 'movie' || itemType === 'movies') {
    type = 'movie';
  } else {
    type = defaultType as any;
  }

  return {
    id: String(item.id),
    title: item.name || item.title || 'Sans titre',
    year: String(item.year || item.release_date?.substring(0, 4) || ''),
    poster: item.poster || '/placeholder.svg',
    type,
    description: item.description || '',
    popularity: item.popularity || 0,
    genres: item.genres?.map((g: any) => g.name || g) || [],
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'movies';
    const search = url.searchParams.get('search') || '';
    const page = url.searchParams.get('page') || '1';
    
    let endpoint = '';
    let defaultType = 'movie';
    
    if (search) {
      endpoint = `search/${encodeURIComponent(search)}`;
    } else {
      switch (category) {
        case 'movies':
          endpoint = `movies?order=popularity:desc&page=${page}`;
          defaultType = 'movie';
          break;
        case 'series':
          endpoint = `series?order=popularity:desc&page=${page}`;
          defaultType = 'series';
          break;
        case 'animes':
          endpoint = `animes?order=popularity:desc&page=${page}`;
          defaultType = 'anime';
          break;
        case 'docs':
          endpoint = `docs?order=popularity:desc&page=${page}`;
          defaultType = 'documentary';
          break;
        default:
          endpoint = `movies?order=popularity:desc&page=${page}`;
      }
    }

    console.log(`Fetching category: ${category}, endpoint: ${endpoint}`);
    
    const rawData = await fetchDarkiWorldData(endpoint);
    
    const mediaItems: MediaItem[] = [];
    
    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        const transformed = transformMediaItem(item, defaultType);
        if (transformed) {
          mediaItems.push(transformed);
        }
      }
    }

    console.log(`Found ${mediaItems.length} items`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: mediaItems,
      total: mediaItems.length,
      page: parseInt(page),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      data: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
