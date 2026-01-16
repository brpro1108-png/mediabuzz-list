import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://darkiworld15.com';

interface MediaItem {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: 'movie' | 'series' | 'anime' | 'documentary';
  description?: string;
  popularity?: number;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string | null> {
  console.log(`Scraping with Firecrawl: ${url}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['html'],
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firecrawl error:', error);
      return null;
    }

    const data = await response.json();
    return data.data?.html || data.html || null;
  } catch (error) {
    console.error('Firecrawl fetch error:', error);
    return null;
  }
}

function parseMediaFromHtml(html: string, defaultType: 'movie' | 'series' | 'anime' | 'documentary'): MediaItem[] {
  const items: MediaItem[] = [];
  
  // Try to find JSON data embedded in the page (similar to vStream approach)
  // Look for patterns like "data":[...] in script tags or page content
  
  // Pattern 1: Look for JSON in script tags or inline data
  const dataPatterns = [
    /"data"\s*:\s*(\[[\s\S]*?\])\s*,\s*"loader"/,
    /"results"\s*:\s*(\[[\s\S]*?\])/,
    /\{"data"\s*:\s*(\[[\s\S]*?\])/,
  ];

  for (const pattern of dataPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (Array.isArray(jsonData)) {
          for (const item of jsonData) {
            if (item && item.id && item.name) {
              items.push({
                id: String(item.id),
                title: item.name || item.title || 'Sans titre',
                year: String(item.year || item.release_date?.substring(0, 4) || ''),
                poster: item.poster || '/placeholder.svg',
                type: defaultType,
                description: item.description || '',
                popularity: item.popularity || 0,
              });
            }
          }
          if (items.length > 0) {
            console.log(`Found ${items.length} items via JSON pattern`);
            return items;
          }
        }
      } catch (e) {
        console.log('JSON parse failed, trying next pattern');
      }
    }
  }

  // Pattern 2: Parse HTML structure for media cards
  // Look for common patterns in media listing pages
  const cardPatterns = [
    /<a[^>]*href="[^"]*\/(\d+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<[^>]*>([^<]+)<\/[^>]*>[\s\S]*?(\d{4})/gi,
    /<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[\s\S]*?title="([^"]*)"[\s\S]*?(\d{4})/gi,
  ];

  // Simple extraction: find all poster images and titles
  const posterMatches = html.matchAll(/<img[^>]*(?:class="[^"]*poster[^"]*"|data-src="([^"]+)"|src="([^"]+\.(?:jpg|png|webp)[^"]*)")(?:[^>]*alt="([^"]*)")?[^>]*>/gi);
  
  let idCounter = 1;
  for (const match of posterMatches) {
    const poster = match[1] || match[2];
    const title = match[3] || `Media ${idCounter}`;
    
    if (poster && !poster.includes('placeholder') && !poster.includes('logo')) {
      items.push({
        id: `${defaultType}-${idCounter++}`,
        title: title,
        year: '',
        poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
        type: defaultType,
        description: '',
        popularity: 0,
      });
    }
  }

  // Also try to find titles in link text
  const linkMatches = html.matchAll(/<a[^>]*href="\/(?:movies|series|animes|docs)\/(\d+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</gi);
  
  for (const match of linkMatches) {
    const id = match[1];
    const title = match[2].trim();
    
    // Check if we already have this ID
    if (!items.find(item => item.id === id)) {
      items.push({
        id: id,
        title: title,
        year: '',
        poster: '/placeholder.svg',
        type: defaultType,
        description: '',
        popularity: 0,
      });
    }
  }

  console.log(`Extracted ${items.length} items from HTML`);
  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'movies';
    const page = url.searchParams.get('page') || '1';
    
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Service temporarily unavailable',
        data: [],
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let endpoint = '';
    let defaultType: 'movie' | 'series' | 'anime' | 'documentary' = 'movie';
    
    switch (category) {
      case 'movies':
        endpoint = '/movies';
        defaultType = 'movie';
        break;
      case 'series':
        endpoint = '/series';
        defaultType = 'series';
        break;
      case 'animes':
        endpoint = '/animes';
        defaultType = 'anime';
        break;
      case 'docs':
        endpoint = '/docs';
        defaultType = 'documentary';
        break;
      default:
        endpoint = '/movies';
    }

    const pageUrl = page !== '1' ? `${BASE_URL}${endpoint}?page=${page}` : `${BASE_URL}${endpoint}`;
    console.log(`Fetching: ${pageUrl}`);

    const html = await scrapeWithFirecrawl(pageUrl, firecrawlKey);
    
    if (!html) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to scrape page',
        data: [],
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mediaItems = parseMediaFromHtml(html, defaultType);

    console.log(`Found ${mediaItems.length} items for ${category}`);

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
      error: 'An error occurred processing your request',
      data: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
