import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const SERIES_GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  10762: 'Kids', 9648: 'Mystery', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
  10768: 'War & Politics', 37: 'Western'
};

async function fetchTMDB(endpoint: string, apiKey: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'fr-FR');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

    if (!tmdbApiKey) {
      return new Response(JSON.stringify({ error: 'TMDB API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use service role for cron job access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a manual sync (with auth) or cron job
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userSupabase.auth.getUser();
      userId = user?.id || null;
    }

    console.log(`[sync-tmdb] Starting sync${userId ? ` for user ${userId}` : ' for all users'}`);

    // Get all users with import state (or specific user)
    let query = supabase.from('import_state').select('user_id');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data: users } = await query;

    if (!users || users.length === 0) {
      console.log('[sync-tmdb] No users to sync');
      return new Response(JSON.stringify({ success: true, message: 'No users to sync' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalImported = 0;
    let totalSkipped = 0;

    // Fetch latest content from TMDB (first 3 pages of trending)
    const [trendingMovies, trendingSeries] = await Promise.all([
      fetchTMDB('/trending/movie/week', tmdbApiKey, { page: '1' }),
      fetchTMDB('/trending/tv/week', tmdbApiKey, { page: '1' }),
    ]);

    for (const userRecord of users) {
      const currentUserId = userRecord.user_id;

      // Sync movies
      for (const movie of trendingMovies.results) {
        const { data: existing } = await supabase
          .from('media_items')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('tmdb_id', movie.id)
          .eq('media_type', 'movie')
          .maybeSingle();

        if (existing) {
          totalSkipped++;
          continue;
        }

        const genres = (movie.genre_ids || []).map((id: number) => MOVIE_GENRES[id]).filter(Boolean);

        const { error } = await supabase
          .from('media_items')
          .insert({
            user_id: currentUserId,
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
            backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}` : null,
            overview: movie.overview,
            media_type: 'movie',
            genres,
            vote_average: movie.vote_average,
            release_date: movie.release_date || null,
          });

        if (!error) {
          totalImported++;
        }
      }

      // Sync series
      for (const series of trendingSeries.results) {
        const { data: existing } = await supabase
          .from('media_items')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('tmdb_id', series.id)
          .eq('media_type', 'series')
          .maybeSingle();

        if (existing) {
          totalSkipped++;
          continue;
        }

        const genres = (series.genre_ids || []).map((id: number) => SERIES_GENRES[id]).filter(Boolean);
        const isAnime = genres.includes('Animation');
        const isDocumentary = genres.includes('Documentary');
        const mediaType = isDocumentary ? 'documentary' : (isAnime ? 'anime' : 'series');

        const { error } = await supabase
          .from('media_items')
          .insert({
            user_id: currentUserId,
            tmdb_id: series.id,
            title: series.name,
            poster_path: series.poster_path ? `${TMDB_IMAGE_BASE}${series.poster_path}` : null,
            backdrop_path: series.backdrop_path ? `${TMDB_IMAGE_BASE}${series.backdrop_path}` : null,
            overview: series.overview,
            media_type: mediaType,
            genres,
            vote_average: series.vote_average,
            release_date: series.first_air_date || null,
          });

        if (!error) {
          totalImported++;
        }
      }

      // Update last sync time
      await supabase
        .from('import_state')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', currentUserId);
    }

    console.log(`[sync-tmdb] Sync complete: imported=${totalImported}, skipped=${totalSkipped}`);

    return new Response(JSON.stringify({
      success: true,
      imported: totalImported,
      skipped: totalSkipped,
      usersProcessed: users.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[sync-tmdb] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
