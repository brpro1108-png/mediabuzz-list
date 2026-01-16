import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface MediaItem {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: 'movie' | 'series' | 'anime' | 'documentary';
  description?: string;
  popularity?: number;
  genres?: number[];
  genreNames?: string[];
  releaseDate?: string;
}

// Genre mappings
const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Crime',
  99: 'Documentaire', 18: 'Drame', 10751: 'Famille', 14: 'Fantastique', 36: 'Histoire',
  27: 'Horreur', 10402: 'Musique', 9648: 'Mystère', 10749: 'Romance', 878: 'Science-Fiction',
  10770: 'Téléfilm', 53: 'Thriller', 10752: 'Guerre', 37: 'Western'
};

const SERIES_GENRES: Record<number, string> = {
  10759: 'Action & Aventure', 16: 'Animation', 35: 'Comédie', 80: 'Crime',
  99: 'Documentaire', 18: 'Drame', 10751: 'Famille', 10762: 'Enfants', 9648: 'Mystère',
  10763: 'News', 10764: 'Réalité', 10765: 'Sci-Fi & Fantastique', 10766: 'Soap',
  10767: 'Talk', 10768: 'Guerre & Politique', 37: 'Western'
};

// Major TV networks for discovering more content
const TV_NETWORKS = [
  213,   // Netflix
  2739,  // Disney+
  1024,  // Amazon Prime
  49,    // HBO
  67,    // Showtime
  2552,  // Apple TV+
  453,   // Hulu
  56,    // Cartoon Network
  2087,  // YouTube Premium
  174,   // AMC
  19,    // FOX
  6,     // NBC
  16,    // CBS
  2,     // ABC
  71,    // The CW
  43,    // Nickelodeon
  44,    // Disney Channel
  34,    // Lifetime
  88,    // FX
  318,   // Starz
  4,     // BBC One
  493,   // BBC Two
  14,    // BBC Three
  26,    // Channel 4
  103,   // ITV
  3,     // TF1
  11,    // M6
  1,     // Canal+
  47,    // France 2
  78,    // France 3
  96,    // Arte
  13,    // RTL
  207,   // ProSieben
  232,   // RAI 1
  48,    // Mediaset
  150,   // Antena 3
  108,   // Telecinco
  97,    // Televisa
  22,    // TV Globo
  1465,  // RTP1
  73,    // TVN
  366,   // TVP
  299,   // Cuatro
  176,   // La Sexta
  455,   // Paramount+
  3186,  // HBO Max
  4330,  // Paramount+
  1709,  // Max
];

// Languages for international content
const LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru', 'tr', 'pl', 'nl'];

// Production countries
const COUNTRIES = ['US', 'GB', 'FR', 'ES', 'DE', 'IT', 'JP', 'KR', 'MX', 'BR', 'AR', 'CO', 'IN', 'CA', 'AU'];

async function fetchTMDB(endpoint: string, apiKey: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "fr-FR");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  return response.json();
}

function transformMovie(item: any): MediaItem {
  const genres = item.genre_ids || [];
  const genreNames = genres.map((id: number) => MOVIE_GENRES[id]).filter(Boolean);
  
  let type: MediaItem['type'] = 'movie';
  if (genres.includes(99)) type = 'documentary';
  
  return {
    id: `movie-${item.id}`,
    title: item.title || item.original_title,
    year: (item.release_date || '').substring(0, 4),
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
    type,
    description: item.overview,
    popularity: item.popularity,
    genres,
    genreNames,
    releaseDate: item.release_date,
  };
}

function transformSeries(item: any, forceType?: 'series' | 'anime' | 'documentary'): MediaItem {
  const genres = item.genre_ids || [];
  const genreNames = genres.map((id: number) => SERIES_GENRES[id]).filter(Boolean);
  
  let type: MediaItem['type'] = forceType || 'series';
  if (!forceType) {
    if (genres.includes(16)) type = 'anime';
    else if (genres.includes(99)) type = 'documentary';
  }
  
  return {
    id: `series-${item.id}`,
    title: item.name || item.original_name,
    year: (item.first_air_date || '').substring(0, 4),
    poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
    type,
    description: item.overview,
    popularity: item.popularity,
    genres,
    genreNames,
    releaseDate: item.first_air_date,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "movies";
    const page = url.searchParams.get("page") || "1";
    const search = url.searchParams.get("search") || "";
    const genre = url.searchParams.get("genre") || "";

    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "TMDB API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let data: MediaItem[] = [];
    let totalPages = 1;
    const pageNum = parseInt(page);

    // Search mode - real-time TMDB search
    if (search) {
      // Search across multiple pages for better results
      const searchPages = [1, 2, 3].map(p => 
        category === "movies" 
          ? fetchTMDB("/search/movie", apiKey, { query: search, page: String(p) })
          : fetchTMDB("/search/tv", apiKey, { query: search, page: String(p) })
      );
      
      const results = await Promise.all(searchPages);
      const seenIds = new Set<string>();
      
      for (const result of results) {
        for (const item of result.results || []) {
          if (!item.poster_path) continue;
          const media = category === "movies" ? transformMovie(item) : transformSeries(item);
          if (!seenIds.has(media.id)) {
            seenIds.add(media.id);
            data.push(media);
          }
        }
        totalPages = Math.max(totalPages, Math.min(result.total_pages, 500));
      }
    }
    // Genre filter mode
    else if (genre) {
      const genrePages = [pageNum, pageNum + 1, pageNum + 2].map(p => {
        if (category === "movies") {
          return fetchTMDB("/discover/movie", apiKey, { 
            with_genres: genre, 
            page: String(p),
            sort_by: "popularity.desc"
          });
        } else {
          return fetchTMDB("/discover/tv", apiKey, { 
            with_genres: genre, 
            page: String(p),
            sort_by: "popularity.desc"
          });
        }
      });

      const results = await Promise.all(genrePages);
      const seenIds = new Set<string>();
      
      for (const result of results) {
        for (const item of result.results || []) {
          if (!item.poster_path) continue;
          const media = category === "movies" ? transformMovie(item) : transformSeries(item);
          if (!seenIds.has(media.id)) {
            seenIds.add(media.id);
            data.push(media);
          }
        }
        totalPages = Math.max(totalPages, Math.min(result.total_pages, 500));
      }
    }
    // Full catalog mode - MASSIVELY EXPANDED
    else {
      if (category === "movies") {
        const sources = await Promise.all([
          // Main endpoints
          fetchTMDB("/movie/popular", apiKey, { page }),
          fetchTMDB("/movie/top_rated", apiKey, { page }),
          fetchTMDB("/movie/now_playing", apiKey, { page }),
          fetchTMDB("/movie/upcoming", apiKey, { page }),
          fetchTMDB("/trending/movie/day", apiKey, { page }),
          fetchTMDB("/trending/movie/week", apiKey, { page }),
          
          // All movie genres
          fetchTMDB("/discover/movie", apiKey, { with_genres: "28", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "12", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "16", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "80", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10751", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "14", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "36", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "27", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10402", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "9648", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10749", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "878", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10770", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "53", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10752", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "37", page, sort_by: "popularity.desc" }),
          
          // By language
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "fr", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "es", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "de", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "it", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "ja", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "ko", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "hi", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_original_language: "pt", page, sort_by: "popularity.desc" }),
          
          // By decade
          fetchTMDB("/discover/movie", apiKey, { "primary_release_date.gte": "2020-01-01", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { "primary_release_date.gte": "2010-01-01", "primary_release_date.lte": "2019-12-31", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { "primary_release_date.gte": "2000-01-01", "primary_release_date.lte": "2009-12-31", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { "primary_release_date.gte": "1990-01-01", "primary_release_date.lte": "1999-12-31", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { "primary_release_date.gte": "1980-01-01", "primary_release_date.lte": "1989-12-31", page, sort_by: "popularity.desc" }),
          
          // High rated
          fetchTMDB("/discover/movie", apiKey, { "vote_average.gte": "8", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { "vote_average.gte": "7", "vote_count.gte": "1000", page, sort_by: "vote_average.desc" }),
          
          // Revenue
          fetchTMDB("/discover/movie", apiKey, { page, sort_by: "revenue.desc" }),
        ]);
        
        const seenIds = new Set<string>();
        for (const result of sources) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
            const movie = transformMovie(item);
            if (!seenIds.has(movie.id) && movie.type === 'movie') {
              seenIds.add(movie.id);
              data.push(movie);
            }
          }
        }
        totalPages = 500;
      } 
      else if (category === "series") {
        // Get network chunks to avoid too many parallel requests
        const networkChunk1 = TV_NETWORKS.slice(0, 15);
        const networkChunk2 = TV_NETWORKS.slice(15, 30);
        
        const sources = await Promise.all([
          // Main endpoints
          fetchTMDB("/tv/popular", apiKey, { page }),
          fetchTMDB("/tv/top_rated", apiKey, { page }),
          fetchTMDB("/tv/on_the_air", apiKey, { page }),
          fetchTMDB("/tv/airing_today", apiKey, { page }),
          fetchTMDB("/trending/tv/day", apiKey, { page }),
          fetchTMDB("/trending/tv/week", apiKey, { page }),
          
          // All TV genres
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10759", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "80", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10751", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10762", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "9648", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10763", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10764", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10765", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10766", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10767", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10768", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "37", page, sort_by: "popularity.desc" }),
          
          // By language - for international shows like Chica Vampiro
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "fr", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "de", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "it", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "pt", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ja", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ko", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "zh", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ar", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "hi", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "tr", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ru", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "pl", page, sort_by: "popularity.desc" }),
          
          // Spanish language kids/teen shows (like Chica Vampiro)
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", with_genres: "10762", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", with_genres: "10751", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", with_genres: "35", page, sort_by: "popularity.desc" }),
          
          // Latin American content
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "CO", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "MX", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "AR", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "BR", page, sort_by: "popularity.desc" }),
          
          // By networks - chunk 1
          ...networkChunk1.map(id => 
            fetchTMDB("/discover/tv", apiKey, { with_networks: String(id), page, sort_by: "popularity.desc" })
          ),
          
          // By decade
          fetchTMDB("/discover/tv", apiKey, { "first_air_date.gte": "2020-01-01", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { "first_air_date.gte": "2010-01-01", "first_air_date.lte": "2019-12-31", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { "first_air_date.gte": "2000-01-01", "first_air_date.lte": "2009-12-31", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { "first_air_date.gte": "1990-01-01", "first_air_date.lte": "1999-12-31", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { "first_air_date.gte": "1980-01-01", "first_air_date.lte": "1989-12-31", page, sort_by: "popularity.desc" }),
          
          // High rated
          fetchTMDB("/discover/tv", apiKey, { "vote_average.gte": "8", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { "vote_average.gte": "7", "vote_count.gte": "500", page, sort_by: "vote_average.desc" }),
          
          // Long running shows
          fetchTMDB("/discover/tv", apiKey, { "with_status": "0", page, sort_by: "popularity.desc" }),
          
          // Returning series
          fetchTMDB("/discover/tv", apiKey, { "with_status": "0", page, sort_by: "first_air_date.desc" }),
        ]);
        
        // Second batch of networks
        const networkSources2 = await Promise.all(
          networkChunk2.map(id => 
            fetchTMDB("/discover/tv", apiKey, { with_networks: String(id), page, sort_by: "popularity.desc" })
          )
        );
        
        const seenIds = new Set<string>();
        for (const result of [...sources, ...networkSources2]) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
            const series = transformSeries(item);
            if (!seenIds.has(series.id) && series.type === 'series') {
              seenIds.add(series.id);
              data.push(series);
            }
          }
        }
        totalPages = 500;
      }
      else if (category === "animes") {
        const sources = await Promise.all([
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", with_original_language: "ja", page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", with_original_language: "ja", page, sort_by: "vote_average.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "16", with_original_language: "ja", page }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "16", with_original_language: "ja", page, sort_by: "vote_average.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_keywords: "210024", page }),
          fetchTMDB("/discover/tv", apiKey, { with_keywords: "210024", page, sort_by: "vote_average.desc" }),
          fetchTMDB("/trending/tv/week", apiKey, { page }),
          // Different decades
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", with_original_language: "ja", "first_air_date.gte": "2020-01-01", page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", with_original_language: "ja", "first_air_date.gte": "2010-01-01", "first_air_date.lte": "2019-12-31", page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", with_original_language: "ja", "first_air_date.gte": "2000-01-01", "first_air_date.lte": "2009-12-31", page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "16", with_original_language: "ja", "first_air_date.gte": "1990-01-01", "first_air_date.lte": "1999-12-31", page }),
        ]);
        
        const seenIds = new Set<string>();
        for (const result of sources) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
            const isJapanese = item.original_language === 'ja';
            const hasAnimation = (item.genre_ids || []).includes(16);
            if (!isJapanese && !hasAnimation) continue;
            
            const anime = item.title ? transformMovie(item) : transformSeries(item, 'anime');
            anime.type = 'anime';
            if (!seenIds.has(anime.id)) {
              seenIds.add(anime.id);
              data.push(anime);
            }
          }
        }
        totalPages = 500;
      }
      else if (category === "docs") {
        const sources = await Promise.all([
          fetchTMDB("/discover/movie", apiKey, { with_genres: "99", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "99", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "99", page, sort_by: "vote_average.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "99", page, sort_by: "vote_average.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "99", page, sort_by: "release_date.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "99", page, sort_by: "first_air_date.desc" }),
          // Different languages
          fetchTMDB("/discover/movie", apiKey, { with_genres: "99", with_original_language: "en", page }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "99", with_original_language: "fr", page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "99", with_original_language: "en", page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "99", with_original_language: "fr", page }),
        ]);
        
        const seenIds = new Set<string>();
        for (const result of sources) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
            const doc = item.title ? transformMovie(item) : transformSeries(item, 'documentary');
            doc.type = 'documentary';
            if (!seenIds.has(doc.id)) {
              seenIds.add(doc.id);
              data.push(doc);
            }
          }
        }
        totalPages = 500;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data, 
        page: parseInt(page),
        totalPages,
        hasMore: parseInt(page) < totalPages
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("TMDB API Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
