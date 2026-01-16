import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

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

// Genre IDs for anime detection (Animation genre)
const ANIMATION_GENRE_ID = 16;
const DOCUMENTARY_GENRE_ID = 99;

async function fetchTMDB(endpoint: string, apiKey: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'fr-FR');
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  console.log(`Fetching TMDB: ${url.toString()}`);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.text();
    console.error('TMDB error:', error);
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

function transformMovie(item: any): MediaItem {
  const isDocumentary = item.genre_ids?.includes(DOCUMENTARY_GENRE_ID);
  const isAnimation = item.genre_ids?.includes(ANIMATION_GENRE_ID);
  
  let type: 'movie' | 'series' | 'anime' | 'documentary' = 'movie';
  if (isDocumentary) type = 'documentary';
  else if (isAnimation) type = 'anime'; // Animation movies treated as anime
  
  return {
    id: `movie-${item.id}`,
    title: item.title || item.name || 'Sans titre',
    year: (item.release_date || item.first_air_date || '').substring(0, 4),
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '/placeholder.svg',
    type,
    description: item.overview || '',
    popularity: item.popularity || 0,
  };
}

function transformSeries(item: any, forceType?: 'series' | 'anime' | 'documentary'): MediaItem {
  const isAnimation = item.genre_ids?.includes(ANIMATION_GENRE_ID);
  const isDocumentary = item.genre_ids?.includes(DOCUMENTARY_GENRE_ID);
  
  let type: 'movie' | 'series' | 'anime' | 'documentary' = forceType || 'series';
  if (!forceType) {
    if (isDocumentary) type = 'documentary';
    else if (isAnimation) type = 'anime';
  }
  
  return {
    id: `series-${item.id}`,
    title: item.name || item.title || 'Sans titre',
    year: (item.first_air_date || item.release_date || '').substring(0, 4),
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '/placeholder.svg',
    type,
    description: item.overview || '',
    popularity: item.popularity || 0,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'movies';
    const page = url.searchParams.get('page') || '1';
    
    const apiKey = Deno.env.get('TMDB_API_KEY');
    
    if (!apiKey) {
      console.error('TMDB_API_KEY not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'TMDB API key not configured',
        data: [],
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let mediaItems: MediaItem[] = [];

    switch (category) {
      case 'movies': {
        // Fetch popular movies
        const data = await fetchTMDB('/movie/popular', apiKey, { page });
        mediaItems = data.results
          .filter((item: any) => !item.genre_ids?.includes(DOCUMENTARY_GENRE_ID))
          .map((item: any) => transformMovie(item));
        break;
      }
      
      case 'series': {
        // Fetch popular TV series (excluding animation and documentary)
        const data = await fetchTMDB('/tv/popular', apiKey, { page });
        mediaItems = data.results
          .filter((item: any) => 
            !item.genre_ids?.includes(ANIMATION_GENRE_ID) && 
            !item.genre_ids?.includes(DOCUMENTARY_GENRE_ID)
          )
          .map((item: any) => transformSeries(item, 'series'));
        break;
      }
      
      case 'animes': {
        // Fetch animation TV series (Japanese origin preferred)
        const data = await fetchTMDB('/discover/tv', apiKey, { 
          page,
          with_genres: String(ANIMATION_GENRE_ID),
          sort_by: 'popularity.desc',
        });
        mediaItems = data.results.map((item: any) => transformSeries(item, 'anime'));
        break;
      }
      
      case 'docs': {
        // Fetch documentary TV series and movies
        const [tvData, movieData] = await Promise.all([
          fetchTMDB('/discover/tv', apiKey, { 
            page,
            with_genres: String(DOCUMENTARY_GENRE_ID),
            sort_by: 'popularity.desc',
          }),
          fetchTMDB('/discover/movie', apiKey, { 
            page,
            with_genres: String(DOCUMENTARY_GENRE_ID),
            sort_by: 'popularity.desc',
          }),
        ]);
        
        const tvDocs = tvData.results.map((item: any) => transformSeries(item, 'documentary'));
        const movieDocs = movieData.results.map((item: any) => {
          const transformed = transformMovie(item);
          transformed.type = 'documentary';
          return transformed;
        });
        
        // Interleave TV and movie documentaries
        mediaItems = [...tvDocs, ...movieDocs].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      }
      
      default:
        mediaItems = [];
    }

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
      error: errorMessage,
      data: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
