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
  releaseDate?: string;
}

// Genre IDs
const ANIMATION_GENRE_ID = 16;
const DOCUMENTARY_GENRE_ID = 99;
const KIDS_GENRE_ID = 10762; // Kids TV
const FAMILY_GENRE_ID = 10751; // Family movies
const COMEDY_GENRE_ID = 35; // Comedy
const DRAMA_GENRE_ID = 18; // Drama
const SOAP_GENRE_ID = 10766; // Soap / Telenovela

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
  else if (isAnimation) type = 'anime';
  
  const releaseDate = item.release_date || item.first_air_date || '';
  
  return {
    id: `movie-${item.id}`,
    title: item.title || item.name || 'Sans titre',
    year: releaseDate.substring(0, 4),
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '/placeholder.svg',
    type,
    description: item.overview || '',
    popularity: item.popularity || 0,
    releaseDate,
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
  
  const releaseDate = item.first_air_date || item.release_date || '';
  
  return {
    id: `series-${item.id}`,
    title: item.name || item.title || 'Sans titre',
    year: releaseDate.substring(0, 4),
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '/placeholder.svg',
    type,
    description: item.overview || '',
    popularity: item.popularity || 0,
    releaseDate,
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
        // Fetch ALL movie sources for maximum content
        const [popular, topRated, nowPlaying, upcoming, trending, action, comedy, drama, horror, scifi, family, romance, thriller] = await Promise.all([
          fetchTMDB('/movie/popular', apiKey, { page }),
          fetchTMDB('/movie/top_rated', apiKey, { page }),
          fetchTMDB('/movie/now_playing', apiKey, { page }),
          fetchTMDB('/movie/upcoming', apiKey, { page }),
          fetchTMDB('/trending/movie/week', apiKey, { page }),
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '28' }), // Action
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '35' }), // Comedy
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '18' }), // Drama
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '27' }), // Horror
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '878' }), // Sci-Fi
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '10751' }), // Family
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '10749' }), // Romance
          fetchTMDB('/discover/movie', apiKey, { page, with_genres: '53' }), // Thriller
        ]);
        
        const allMovies = [
          ...popular.results,
          ...topRated.results,
          ...nowPlaying.results,
          ...upcoming.results,
          ...trending.results,
          ...action.results,
          ...comedy.results,
          ...drama.results,
          ...horror.results,
          ...scifi.results,
          ...family.results,
          ...romance.results,
          ...thriller.results,
        ];
        
        // Remove duplicates and documentaries
        const seen = new Set<number>();
        mediaItems = allMovies
          .filter((item: any) => {
            if (seen.has(item.id) || item.genre_ids?.includes(DOCUMENTARY_GENRE_ID)) return false;
            seen.add(item.id);
            return true;
          })
          .map((item: any) => transformMovie(item));
        break;
      }
      
      case 'series': {
        // Fetch ALL types of TV series
        const [popular, topRated, onAir, airing, trending, kids, soaps, comedy, drama, action, crime, mystery, reality, scifi, family] = await Promise.all([
          fetchTMDB('/tv/popular', apiKey, { page }),
          fetchTMDB('/tv/top_rated', apiKey, { page }),
          fetchTMDB('/tv/on_the_air', apiKey, { page }),
          fetchTMDB('/tv/airing_today', apiKey, { page }),
          fetchTMDB('/trending/tv/week', apiKey, { page }),
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: String(KIDS_GENRE_ID) }),
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: String(SOAP_GENRE_ID) }),
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: String(COMEDY_GENRE_ID) }),
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: String(DRAMA_GENRE_ID) }),
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: '10759' }), // Action & Adventure
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: '80' }), // Crime
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: '9648' }), // Mystery
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: '10764' }), // Reality
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: '10765' }), // Sci-Fi & Fantasy
          fetchTMDB('/discover/tv', apiKey, { page, with_genres: '10751' }), // Family
        ]);
        
        const allSeries = [
          ...popular.results,
          ...topRated.results,
          ...onAir.results,
          ...airing.results,
          ...trending.results,
          ...kids.results,
          ...soaps.results,
          ...comedy.results,
          ...drama.results,
          ...action.results,
          ...crime.results,
          ...mystery.results,
          ...reality.results,
          ...scifi.results,
          ...family.results,
        ];
        
        // Remove duplicates, animation and documentary
        const seen = new Set<number>();
        mediaItems = allSeries
          .filter((item: any) => {
            if (seen.has(item.id)) return false;
            if (item.genre_ids?.includes(ANIMATION_GENRE_ID)) return false;
            if (item.genre_ids?.includes(DOCUMENTARY_GENRE_ID)) return false;
            seen.add(item.id);
            return true;
          })
          .map((item: any) => transformSeries(item, 'series'));
        break;
      }
      
      case 'animes': {
        // Fetch animation TV series from multiple sources
        const [discover, popular, topRated] = await Promise.all([
          fetchTMDB('/discover/tv', apiKey, { 
            page,
            with_genres: String(ANIMATION_GENRE_ID),
            sort_by: 'popularity.desc',
          }),
          fetchTMDB('/discover/tv', apiKey, { 
            page,
            with_genres: String(ANIMATION_GENRE_ID),
            sort_by: 'vote_average.desc',
            'vote_count.gte': '100',
          }),
          fetchTMDB('/discover/movie', apiKey, { 
            page,
            with_genres: String(ANIMATION_GENRE_ID),
            sort_by: 'popularity.desc',
          }),
        ]);
        
        const allAnimes = [
          ...discover.results.map((item: any) => transformSeries(item, 'anime')),
          ...popular.results.map((item: any) => transformSeries(item, 'anime')),
          ...topRated.results.map((item: any) => {
            const transformed = transformMovie(item);
            transformed.type = 'anime';
            return transformed;
          }),
        ];
        
        // Remove duplicates
        const seen = new Set<string>();
        mediaItems = allAnimes.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        break;
      }
      
      case 'docs': {
        // Fetch documentary TV series and movies
        const [tvDiscover, tvTopRated, movieDiscover, movieTopRated] = await Promise.all([
          fetchTMDB('/discover/tv', apiKey, { 
            page,
            with_genres: String(DOCUMENTARY_GENRE_ID),
            sort_by: 'popularity.desc',
          }),
          fetchTMDB('/discover/tv', apiKey, { 
            page,
            with_genres: String(DOCUMENTARY_GENRE_ID),
            sort_by: 'vote_average.desc',
            'vote_count.gte': '50',
          }),
          fetchTMDB('/discover/movie', apiKey, { 
            page,
            with_genres: String(DOCUMENTARY_GENRE_ID),
            sort_by: 'popularity.desc',
          }),
          fetchTMDB('/discover/movie', apiKey, { 
            page,
            with_genres: String(DOCUMENTARY_GENRE_ID),
            sort_by: 'vote_average.desc',
            'vote_count.gte': '50',
          }),
        ]);
        
        const allDocs = [
          ...tvDiscover.results.map((item: any) => transformSeries(item, 'documentary')),
          ...tvTopRated.results.map((item: any) => transformSeries(item, 'documentary')),
          ...movieDiscover.results.map((item: any) => {
            const transformed = transformMovie(item);
            transformed.type = 'documentary';
            return transformed;
          }),
          ...movieTopRated.results.map((item: any) => {
            const transformed = transformMovie(item);
            transformed.type = 'documentary';
            return transformed;
          }),
        ];
        
        // Remove duplicates and sort by popularity
        const seen = new Set<string>();
        mediaItems = allDocs
          .filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          })
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      }
      
      default:
        mediaItems = [];
    }

    console.log(`Found ${mediaItems.length} items for ${category} (page ${page})`);

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
