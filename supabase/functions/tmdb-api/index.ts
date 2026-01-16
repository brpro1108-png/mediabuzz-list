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
  collectionId?: number;
  collectionName?: string;
  smartCollection?: string;
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

// Major TV networks
const TV_NETWORKS = [
  213, 2739, 1024, 49, 67, 2552, 453, 56, 2087, 174, 19, 6, 16, 2, 71, 43, 44, 
  34, 88, 318, 4, 493, 14, 26, 103, 3, 11, 1, 47, 78, 96, 13, 207, 232, 48, 
  150, 108, 97, 22, 1465, 73, 366, 299, 176, 455, 3186, 4330, 1709,
  359, 1006, 77, 65, 251, 270, 292, 330, 384, 436, 620, 743, 1035,
];

// Collection keywords for smart matching
const COLLECTION_KEYWORDS: Record<string, number[]> = {
  marvel: [180547, 9715],
  dc: [229266, 9714],
  disney: [100],
  pixar: [7587],
  ghibli: [10342],
};

// Optimized fetch
async function fetchTMDB(endpoint: string, apiKey: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "fr-FR");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(`TMDB error: ${response.status} for ${endpoint}`);
    return { results: [] };
  }
  return response.json();
}

// Fetch movie details for collection info
async function getMovieDetails(movieId: number, apiKey: string): Promise<{ collectionId?: number; collectionName?: string } | null> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/movie/${movieId}`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "fr-FR");
    
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.belongs_to_collection) {
      return {
        collectionId: data.belongs_to_collection.id,
        collectionName: data.belongs_to_collection.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function transformMovie(item: any, collectionInfo?: { collectionId?: number; collectionName?: string }, smartCollection?: string): MediaItem {
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
    collectionId: collectionInfo?.collectionId,
    collectionName: collectionInfo?.collectionName,
    smartCollection,
  };
}

function transformSeries(item: any, forceType?: 'series' | 'anime' | 'documentary', smartCollection?: string): MediaItem {
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
    smartCollection,
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
    const smartCollectionType = url.searchParams.get("smart") || "";
    const withCollections = url.searchParams.get("collections") === "true";

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

    // Search mode
    if (search) {
      const searchPages = [1, 2, 3, 4, 5].map(p => 
        category === "movies" 
          ? fetchTMDB("/search/movie", apiKey, { query: search, page: String(p) })
          : fetchTMDB("/search/tv", apiKey, { query: search, page: String(p) })
      );
      
      const results = await Promise.all(searchPages);
      const seenIds = new Set<string>();
      const movieIds: number[] = [];
      
      for (const result of results) {
        for (const item of result.results || []) {
          if (!item.poster_path) continue;
          const media = category === "movies" ? transformMovie(item) : transformSeries(item);
          if (!seenIds.has(media.id)) {
            seenIds.add(media.id);
            data.push(media);
            if (category === "movies") movieIds.push(item.id);
          }
        }
        totalPages = Math.max(totalPages, Math.min(result.total_pages || 1, 500));
      }

      // Fetch collection info for movies
      if (category === "movies" && withCollections && movieIds.length > 0) {
        const collectionPromises = movieIds.slice(0, 15).map(id => getMovieDetails(id, apiKey));
        const collectionResults = await Promise.all(collectionPromises);
        data = data.map((item, index) => {
          if (index < 15 && collectionResults[index]) {
            return { ...item, ...collectionResults[index] };
          }
          return item;
        });
      }
    }
    // Smart collection mode
    else if (smartCollectionType) {
      const currentYear = new Date().getFullYear();
      let smartSources: Promise<any>[] = [];
      let collectionName = '';

      switch (smartCollectionType) {
        case 'trending':
          collectionName = 'Tendances';
          smartSources = [
            fetchTMDB("/trending/movie/day", apiKey, { page }),
            fetchTMDB("/trending/movie/week", apiKey, { page }),
          ];
          break;
        case 'now_playing':
          collectionName = 'Au cinéma';
          smartSources = [
            fetchTMDB("/movie/now_playing", apiKey, { page, region: "FR" }),
            fetchTMDB("/movie/now_playing", apiKey, { page, region: "US" }),
          ];
          break;
        case 'upcoming':
          collectionName = 'Prochaines sorties';
          smartSources = [
            fetchTMDB("/movie/upcoming", apiKey, { page, region: "FR" }),
            fetchTMDB("/movie/upcoming", apiKey, { page, region: "US" }),
          ];
          break;
        case 'top_rated':
          collectionName = 'Mieux notés';
          smartSources = [fetchTMDB("/movie/top_rated", apiKey, { page })];
          break;
        case 'box_office_2024':
          collectionName = 'Box Office 2024';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { 
              page, 
              "primary_release_year": "2024",
              sort_by: "revenue.desc",
              "vote_count.gte": "100"
            }),
          ];
          break;
        case 'box_office_2023':
          collectionName = 'Box Office 2023';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { 
              page, 
              "primary_release_year": "2023",
              sort_by: "revenue.desc",
              "vote_count.gte": "100"
            }),
          ];
          break;
        case 'box_office_2022':
          collectionName = 'Box Office 2022';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { 
              page, 
              "primary_release_year": "2022",
              sort_by: "revenue.desc",
              "vote_count.gte": "100"
            }),
          ];
          break;
        case 'classics':
          collectionName = 'Classiques';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { 
              page, 
              "primary_release_date.lte": "1990-12-31",
              sort_by: "vote_average.desc",
              "vote_count.gte": "1000"
            }),
          ];
          break;
        case 'family':
          collectionName = 'Famille';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_genres: "10751", sort_by: "popularity.desc" }),
          ];
          break;
        case 'action':
          collectionName = 'Action';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_genres: "28", sort_by: "popularity.desc", "vote_count.gte": "500" }),
          ];
          break;
        case 'scifi':
          collectionName = 'Sci-Fi';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_genres: "878", sort_by: "popularity.desc" }),
          ];
          break;
        case 'horror':
          collectionName = 'Horreur';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_genres: "27", sort_by: "popularity.desc" }),
          ];
          break;
        case 'romance':
          collectionName = 'Romance';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_genres: "10749", sort_by: "popularity.desc" }),
          ];
          break;
        case 'comedy':
          collectionName = 'Comédie';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_genres: "35", sort_by: "popularity.desc" }),
          ];
          break;
        case 'oscar':
          collectionName = 'Oscarisés';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { 
              page, 
              sort_by: "vote_average.desc",
              "vote_count.gte": "2000",
              "vote_average.gte": "8"
            }),
          ];
          break;
        case 'marvel':
          collectionName = 'Marvel';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_companies: "420", sort_by: "primary_release_date.desc" }),
          ];
          break;
        case 'dc':
          collectionName = 'DC';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_companies: "9993", sort_by: "primary_release_date.desc" }),
          ];
          break;
        case 'disney':
          collectionName = 'Disney';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_companies: "2", sort_by: "popularity.desc" }),
          ];
          break;
        case 'pixar':
          collectionName = 'Pixar';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_companies: "3", sort_by: "primary_release_date.desc" }),
          ];
          break;
        case 'ghibli':
          collectionName = 'Studio Ghibli';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_companies: "10342", sort_by: "primary_release_date.desc" }),
          ];
          break;
        case 'french':
          collectionName = 'Français';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "fr", sort_by: "popularity.desc" }),
          ];
          break;
        case 'korean':
          collectionName = 'Coréen';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "ko", sort_by: "popularity.desc" }),
          ];
          break;
        case 'japanese':
          collectionName = 'Japonais';
          smartSources = [
            fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "ja", sort_by: "popularity.desc" }),
          ];
          break;
        default:
          smartSources = [fetchTMDB("/movie/popular", apiKey, { page })];
      }

      const results = await Promise.all(smartSources);
      const seenIds = new Set<string>();

      for (const result of results) {
        for (const item of result.results || []) {
          if (!item.poster_path) continue;
          const movie = transformMovie(item, undefined, smartCollectionType);
          if (!seenIds.has(movie.id)) {
            seenIds.add(movie.id);
            data.push(movie);
          }
        }
        totalPages = Math.max(totalPages, Math.min(result.total_pages || 1, 500));
      }
    }
    // Genre filter mode
    else if (genre) {
      const result = category === "movies"
        ? await fetchTMDB("/discover/movie", apiKey, { with_genres: genre, page, sort_by: "popularity.desc" })
        : await fetchTMDB("/discover/tv", apiKey, { with_genres: genre, page, sort_by: "popularity.desc" });
      
      for (const item of result.results || []) {
        if (!item.poster_path) continue;
        data.push(category === "movies" ? transformMovie(item) : transformSeries(item));
      }
      totalPages = Math.min(result.total_pages || 1, 500);
    }
    // Full catalog mode - MORE sources for MORE content
    else {
      const sourceIndex = (pageNum - 1) % 20;
      
      if (category === "movies") {
        // Extensive movie sources
        const allMovieSources = [
          // Core lists
          () => fetchTMDB("/movie/popular", apiKey, { page }),
          () => fetchTMDB("/movie/top_rated", apiKey, { page }),
          () => fetchTMDB("/movie/now_playing", apiKey, { page }),
          () => fetchTMDB("/movie/upcoming", apiKey, { page }),
          () => fetchTMDB("/trending/movie/day", apiKey, { page }),
          () => fetchTMDB("/trending/movie/week", apiKey, { page }),
          // Genres
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "28", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "878", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "27", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "53", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "10749", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "16", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "14", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "12", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "80", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_genres: "10751", page, sort_by: "popularity.desc" }),
          // Languages
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "fr", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "es", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "ja", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "ko", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "hi", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "de", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "it", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "pt", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "zh", page, sort_by: "popularity.desc" }),
          // Years
          () => fetchTMDB("/discover/movie", apiKey, { primary_release_year: "2024", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { primary_release_year: "2023", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { primary_release_year: "2022", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { primary_release_year: "2021", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { primary_release_year: "2020", page, sort_by: "popularity.desc" }),
          // Studios
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "420", page, sort_by: "popularity.desc" }), // Marvel
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "9993", page, sort_by: "popularity.desc" }), // DC
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "2", page, sort_by: "popularity.desc" }), // Disney
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "3", page, sort_by: "popularity.desc" }), // Pixar
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "33", page, sort_by: "popularity.desc" }), // Universal
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "174", page, sort_by: "popularity.desc" }), // Warner
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "4", page, sort_by: "popularity.desc" }), // Paramount
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "25", page, sort_by: "popularity.desc" }), // Fox
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "5", page, sort_by: "popularity.desc" }), // Columbia
          () => fetchTMDB("/discover/movie", apiKey, { with_companies: "7", page, sort_by: "popularity.desc" }), // DreamWorks
          // Box office
          () => fetchTMDB("/discover/movie", apiKey, { page, sort_by: "revenue.desc", "vote_count.gte": "100" }),
          () => fetchTMDB("/discover/movie", apiKey, { page, sort_by: "vote_average.desc", "vote_count.gte": "1000" }),
        ];

        // Select sources based on page for variety
        const sourcesToUse = [
          ...allMovieSources.slice(0, 6),
          ...allMovieSources.slice(6 + (sourceIndex % 10), 6 + (sourceIndex % 10) + 4),
        ];

        const results = await Promise.all(sourcesToUse.map(fn => fn()));
        
        const seenIds = new Set<string>();
        const movieItems: { item: any; movie: MediaItem }[] = [];
        
        for (const result of results) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
            const movie = transformMovie(item);
            if (!seenIds.has(movie.id) && movie.type === 'movie') {
              seenIds.add(movie.id);
              movieItems.push({ item, movie });
            }
          }
        }

        // Fetch collection info for movies
        if (withCollections && movieItems.length > 0) {
          const movieIdsToFetch = movieItems.slice(0, 25).map(m => m.item.id);
          const collectionPromises = movieIdsToFetch.map(id => getMovieDetails(id, apiKey));
          const collectionResults = await Promise.all(collectionPromises);
          
          movieItems.forEach((item, index) => {
            if (index < 25 && collectionResults[index]) {
              item.movie = { ...item.movie, ...collectionResults[index] };
            }
          });
        }

        data = movieItems.map(m => m.movie);
        totalPages = 500;
      } 
      else if (category === "series") {
        const networkBatch = TV_NETWORKS.slice((sourceIndex % 10) * 5, (sourceIndex % 10) * 5 + 5);
        
        const seriesSources = [
          fetchTMDB("/tv/popular", apiKey, { page }),
          fetchTMDB("/tv/top_rated", apiKey, { page }),
          fetchTMDB("/tv/on_the_air", apiKey, { page }),
          fetchTMDB("/tv/airing_today", apiKey, { page }),
          fetchTMDB("/trending/tv/day", apiKey, { page }),
          fetchTMDB("/trending/tv/week", apiKey, { page }),
          // Genres
          fetchTMDB("/discover/tv", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10759", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10765", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "10762", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "80", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "9648", page, sort_by: "popularity.desc" }),
          // Languages
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "fr", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ko", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ja", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "pt", page, sort_by: "popularity.desc" }),
          // Countries
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "CO", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "MX", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "AR", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "BR", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "GB", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "DE", page, sort_by: "popularity.desc" }),
          // Networks
          ...networkBatch.map(id => fetchTMDB("/discover/tv", apiKey, { with_networks: String(id), page, sort_by: "popularity.desc" })),
        ];
        
        const results = await Promise.all(seriesSources.slice(0, 12));
        
        const seenIds = new Set<string>();
        for (const result of results) {
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
          fetchTMDB("/discover/movie", apiKey, { with_keywords: "210024", page }),
          fetchTMDB("/trending/tv/week", apiKey, { page }),
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
          fetchTMDB("/discover/movie", apiKey, { with_genres: "99", page, sort_by: "vote_average.desc", "vote_count.gte": "100" }),
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
        page: pageNum,
        totalPages,
        hasMore: pageNum < totalPages
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