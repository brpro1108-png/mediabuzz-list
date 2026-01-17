import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  genre_ids: number[];
  vote_average: number;
  release_date: string;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  };
}

interface TMDBSeries {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  genre_ids: number[];
  vote_average: number;
  first_air_date: string;
}

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

    if (!tmdbApiKey) {
      return new Response(JSON.stringify({ error: 'TMDB API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const phase = url.searchParams.get('phase') || 'movies';
    const page = parseInt(url.searchParams.get('page') || '1');

    console.log(`[import-tmdb] User ${user.id} importing ${phase} page ${page}`);

    let imported = 0;
    let skipped = 0;
    let collectionsAdded = 0;
    let totalPages = 500;

    if (phase === 'movies') {
      // Fetch movies from multiple endpoints
      const [popular, topRated, nowPlaying] = await Promise.all([
        fetchTMDB('/movie/popular', tmdbApiKey, { page: page.toString() }),
        fetchTMDB('/movie/top_rated', tmdbApiKey, { page: page.toString() }),
        fetchTMDB('/movie/now_playing', tmdbApiKey, { page: page.toString() }),
      ]);

      totalPages = Math.min(popular.total_pages, 500);
      
      const allMovies: TMDBMovie[] = [...popular.results, ...topRated.results, ...nowPlaying.results];
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );

      for (const movie of uniqueMovies) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('media_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('tmdb_id', movie.id)
          .eq('media_type', 'movie')
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Get movie details for collection info
        let collectionId = null;
        if (movie.belongs_to_collection) {
          const { data: existingCollection } = await supabase
            .from('collections')
            .select('id')
            .eq('user_id', user.id)
            .eq('tmdb_collection_id', movie.belongs_to_collection.id)
            .maybeSingle();

          if (existingCollection) {
            collectionId = existingCollection.id;
          } else {
            const { data: newCollection } = await supabase
              .from('collections')
              .insert({
                user_id: user.id,
                tmdb_collection_id: movie.belongs_to_collection.id,
                name: movie.belongs_to_collection.name,
                poster_path: movie.belongs_to_collection.poster_path 
                  ? `${TMDB_IMAGE_BASE}${movie.belongs_to_collection.poster_path}` 
                  : null,
                backdrop_path: movie.belongs_to_collection.backdrop_path 
                  ? `${TMDB_IMAGE_BASE}${movie.belongs_to_collection.backdrop_path}` 
                  : null,
              })
              .select('id')
              .single();

            if (newCollection) {
              collectionId = newCollection.id;
              collectionsAdded++;
            }
          }
        }

        const genres = movie.genre_ids.map(id => MOVIE_GENRES[id]).filter(Boolean);
        
        const { error: insertError } = await supabase
          .from('media_items')
          .insert({
            user_id: user.id,
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
            backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}` : null,
            overview: movie.overview,
            media_type: 'movie',
            genres,
            vote_average: movie.vote_average,
            release_date: movie.release_date || null,
            collection_id: collectionId,
          });

        if (!insertError) {
          imported++;
        }
      }
    } else if (phase === 'series') {
      const [popular, topRated, onAir] = await Promise.all([
        fetchTMDB('/tv/popular', tmdbApiKey, { page: page.toString() }),
        fetchTMDB('/tv/top_rated', tmdbApiKey, { page: page.toString() }),
        fetchTMDB('/tv/on_the_air', tmdbApiKey, { page: page.toString() }),
      ]);

      totalPages = Math.min(popular.total_pages, 500);

      const allSeries: TMDBSeries[] = [...popular.results, ...topRated.results, ...onAir.results];
      const uniqueSeries = allSeries.filter((series, index, self) => 
        index === self.findIndex(s => s.id === series.id)
      );

      for (const series of uniqueSeries) {
        const { data: existing } = await supabase
          .from('media_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('tmdb_id', series.id)
          .eq('media_type', 'series')
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const genres = series.genre_ids.map(id => SERIES_GENRES[id]).filter(Boolean);
        const isAnime = genres.includes('Animation') && series.genre_ids.includes(16);
        const isDocumentary = genres.includes('Documentary');
        
        const mediaType = isDocumentary ? 'documentary' : (isAnime ? 'anime' : 'series');

        const { error: insertError } = await supabase
          .from('media_items')
          .insert({
            user_id: user.id,
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

        if (!insertError) {
          imported++;
        }
      }
    }

    // Update import state
    const { data: importState } = await supabase
      .from('import_state')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const updateData = {
      user_id: user.id,
      [`${phase}_page`]: page,
      [`${phase}_total_pages`]: totalPages,
      [`${phase}_imported`]: (importState?.[`${phase}_imported`] || 0) + imported,
      [`${phase}_skipped`]: (importState?.[`${phase}_skipped`] || 0) + skipped,
      collections_count: (importState?.collections_count || 0) + collectionsAdded,
      current_phase: phase,
      is_importing: true,
    };

    if (importState) {
      await supabase
        .from('import_state')
        .update(updateData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('import_state')
        .insert(updateData);
    }

    const hasMore = page < totalPages;
    const nextPhase = phase === 'movies' && !hasMore ? 'series' : phase;
    const nextPage = phase === 'movies' && !hasMore ? 1 : (hasMore ? page + 1 : page);
    const isComplete = phase === 'series' && !hasMore;

    if (isComplete) {
      await supabase
        .from('import_state')
        .update({ is_importing: false, last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    console.log(`[import-tmdb] Page ${page}: imported=${imported}, skipped=${skipped}, collections=${collectionsAdded}`);

    return new Response(JSON.stringify({
      success: true,
      phase,
      page,
      totalPages,
      imported,
      skipped,
      collectionsAdded,
      hasMore,
      nextPhase,
      nextPage,
      isComplete,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[import-tmdb] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
