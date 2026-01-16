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

    // Search mode - real-time TMDB search
    if (search) {
      if (category === "movies") {
        const result = await fetchTMDB("/search/movie", apiKey, { query: search, page });
        data = result.results.filter((item: any) => item.poster_path).map(transformMovie);
        totalPages = Math.min(result.total_pages, 500);
      } else {
        const result = await fetchTMDB("/search/tv", apiKey, { query: search, page });
        data = result.results.filter((item: any) => item.poster_path).map((item: any) => transformSeries(item));
        totalPages = Math.min(result.total_pages, 500);
      }
    }
    // Genre filter mode
    else if (genre) {
      if (category === "movies") {
        const result = await fetchTMDB("/discover/movie", apiKey, { 
          with_genres: genre, 
          page,
          sort_by: "popularity.desc"
        });
        data = result.results.filter((item: any) => item.poster_path).map(transformMovie);
        totalPages = Math.min(result.total_pages, 500);
      } else {
        const result = await fetchTMDB("/discover/tv", apiKey, { 
          with_genres: genre, 
          page,
          sort_by: "popularity.desc"
        });
        data = result.results.filter((item: any) => item.poster_path).map((item: any) => transformSeries(item));
        totalPages = Math.min(result.total_pages, 500);
      }
    }
    // Full catalog mode
    else {
      if (category === "movies") {
        const sources = await Promise.all([
          fetchTMDB("/movie/popular", apiKey, { page }),
          fetchTMDB("/movie/top_rated", apiKey, { page }),
          fetchTMDB("/movie/now_playing", apiKey, { page }),
          fetchTMDB("/movie/upcoming", apiKey, { page }),
          fetchTMDB("/trending/movie/week", apiKey, { page }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "28", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "27", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "878", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10749", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "53", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "16", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "14", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "12", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "80", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10751", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "9648", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "10752", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { with_genres: "37", page, sort_by: "popularity.desc" }),
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
        const sources = await Promise.all([
          fetchTMDB("/tv/popular", apiKey, { page }),
          fetchTMDB("/tv/top_rated", apiKey, { page }),
          fetchTMDB("/tv/on_the_air", apiKey, { page }),
          fetchTMDB("/tv/airing_today", apiKey, { page }),
          fetchTMDB("/trending/tv/week", apiKey, { page }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10759", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10765", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "80", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "9648", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10751", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10762", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10766", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10764", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_networks: "43", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_networks: "44", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_networks: "213", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_networks: "2739", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", with_genres: "10766", page }),
        ]);
        
        const seenIds = new Set<string>();
        for (const result of sources) {
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
          fetchTMDB("/discover/movie", apiKey, { with_genres: "16", with_original_language: "ja", page }),
          fetchTMDB("/discover/tv", apiKey, { with_keywords: "210024", page }),
        ]);
        
        const seenIds = new Set<string>();
        for (const result of sources) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
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
