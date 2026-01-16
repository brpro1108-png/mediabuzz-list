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
];

// Famous collection IDs from TMDB
const FAMOUS_COLLECTIONS: Record<string, number> = {
  harrypotter: 1241,      // Harry Potter
  lotr: 119,              // Lord of the Rings
  hobbit: 121938,         // The Hobbit
  starwars: 10,           // Star Wars
  bond: 645,              // James Bond
  fast: 9485,             // Fast & Furious
  jurassic: 328,          // Jurassic Park
  transformers: 8650,     // Transformers
  mission: 87359,         // Mission Impossible
  pirates: 295,           // Pirates of the Caribbean
  matrix: 2344,           // Matrix
  avengers: 86311,        // Avengers
  xmen: 748,              // X-Men
  batman: 263,            // Batman
  spiderman: 531241,      // Spider-Man (MCU)
  iceage: 8354,           // Ice Age
  shrek: 2150,            // Shrek
  toystory: 10194,        // Toy Story
  despicableme: 86066,    // Despicable Me
  hungergames: 131635,    // Hunger Games
  twilight: 33514,        // Twilight
  indianajones: 84,       // Indiana Jones
  alien: 8091,            // Alien
  terminator: 528,        // Terminator
  rocky: 1575,            // Rocky
  diehard: 1570,          // Die Hard
  bourne: 31562,          // Bourne
  johnwick: 404609,       // John Wick
  godfather: 230,         // Godfather
  backtothefuture: 264,   // Back to the Future
  madmax: 8945,           // Mad Max
};

// Studio company IDs
const STUDIO_IDS: Record<string, number> = {
  marvel: 420,
  dc: 9993,
  disney: 2,
  pixar: 3,
  ghibli: 10342,
  dreamworks: 7,
  warner: 174,
  universal: 33,
  paramount: 4,
  sony: 34,
  lionsgate: 1632,
  fox: 25,
  mgm: 21,
};

// Network IDs for streaming platforms
const PLATFORM_NETWORKS: Record<string, number> = {
  netflix: 213,
  disneyplus: 2739,
  hbo: 49,
  prime: 1024,
  appletv: 2552,
  hulu: 453,
  peacock: 3186,
  paramount_plus: 4330,
  showtime: 67,
  starz: 318,
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
    return { results: [], parts: [] };
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

// Fetch collection details to get all movies in a saga
async function fetchCollection(collectionId: number, apiKey: string): Promise<MediaItem[]> {
  try {
    const data = await fetchTMDB(`/collection/${collectionId}`, apiKey);
    if (!data.parts) return [];
    
    return data.parts.map((item: any) => ({
      id: `movie-${item.id}`,
      title: item.title || item.original_title,
      year: (item.release_date || '').substring(0, 4),
      poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
      type: 'movie' as const,
      description: item.overview,
      popularity: item.popularity,
      genres: item.genre_ids || [],
      genreNames: (item.genre_ids || []).map((id: number) => MOVIE_GENRES[id]).filter(Boolean),
      releaseDate: item.release_date,
      collectionId: collectionId,
      collectionName: data.name,
    }));
  } catch {
    return [];
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

      // Fetch collection info for ALL movies in search
      if (category === "movies" && withCollections && movieIds.length > 0) {
        const collectionPromises = movieIds.map(id => getMovieDetails(id, apiKey));
        const collectionResults = await Promise.all(collectionPromises);
        data = data.map((item, index) => {
          if (collectionResults[index]) {
            return { ...item, ...collectionResults[index] };
          }
          return item;
        });
      }
    }
    // Smart collection mode
    else if (smartCollectionType) {
      let smartSources: Promise<any>[] = [];

      // Handle franchise collections by fetching the actual collection
      if (FAMOUS_COLLECTIONS[smartCollectionType]) {
        const collectionMovies = await fetchCollection(FAMOUS_COLLECTIONS[smartCollectionType], apiKey);
        data = collectionMovies;
        totalPages = 1;
      }
      // Handle studios - fetch movies by company
      else if (STUDIO_IDS[smartCollectionType]) {
        const companyId = STUDIO_IDS[smartCollectionType];
        smartSources = [
          fetchTMDB("/discover/movie", apiKey, { page, with_companies: String(companyId), sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { page: String(pageNum + 1), with_companies: String(companyId), sort_by: "popularity.desc" }),
        ];
      }
      // Handle streaming platforms - fetch series by network
      else if (PLATFORM_NETWORKS[smartCollectionType]) {
        const networkId = PLATFORM_NETWORKS[smartCollectionType];
        smartSources = [
          fetchTMDB("/discover/tv", apiKey, { page, with_networks: String(networkId), sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { page: String(pageNum + 1), with_networks: String(networkId), sort_by: "popularity.desc" }),
          fetchTMDB("/discover/movie", apiKey, { page, with_watch_providers: String(networkId), watch_region: "FR", sort_by: "popularity.desc" }),
        ];
      }
      // Handle box office by year
      else if (smartCollectionType.startsWith('box_office_')) {
        const year = smartCollectionType.replace('box_office_', '');
        smartSources = [
          fetchTMDB("/discover/movie", apiKey, { 
            page, 
            primary_release_year: year,
            sort_by: "revenue.desc",
            "vote_count.gte": "50"
          }),
          fetchTMDB("/discover/movie", apiKey, { 
            page: String(pageNum + 1), 
            primary_release_year: year,
            sort_by: "revenue.desc",
            "vote_count.gte": "50"
          }),
        ];
      }
      else {
        switch (smartCollectionType) {
          case 'trending':
            smartSources = [
              fetchTMDB("/trending/movie/day", apiKey, { page }),
              fetchTMDB("/trending/movie/week", apiKey, { page }),
            ];
            break;
          case 'now_playing':
            smartSources = [
              fetchTMDB("/movie/now_playing", apiKey, { page, region: "FR" }),
              fetchTMDB("/movie/now_playing", apiKey, { page, region: "US" }),
            ];
            break;
          case 'upcoming':
            smartSources = [
              fetchTMDB("/movie/upcoming", apiKey, { page, region: "FR" }),
              fetchTMDB("/movie/upcoming", apiKey, { page, region: "US" }),
            ];
            break;
          case 'top_rated':
            smartSources = [fetchTMDB("/movie/top_rated", apiKey, { page })];
            break;
          case 'classics':
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
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "10751", sort_by: "popularity.desc" }),
            ];
            break;
          case 'action':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "28", sort_by: "popularity.desc", "vote_count.gte": "500" }),
            ];
            break;
          case 'scifi':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "878", sort_by: "popularity.desc" }),
            ];
            break;
          case 'horror':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "27", sort_by: "popularity.desc" }),
            ];
            break;
          case 'romance':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "10749", sort_by: "popularity.desc" }),
            ];
            break;
          case 'comedy':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "35", sort_by: "popularity.desc" }),
            ];
            break;
          case 'thriller':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "53", sort_by: "popularity.desc" }),
            ];
            break;
          case 'war':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "10752", sort_by: "popularity.desc" }),
            ];
            break;
          case 'musicals':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "10402", sort_by: "popularity.desc" }),
            ];
            break;
          case 'animation':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "16", sort_by: "popularity.desc" }),
            ];
            break;
          case 'adventure':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "12", sort_by: "popularity.desc" }),
            ];
            break;
          case 'crime':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "80", sort_by: "popularity.desc" }),
            ];
            break;
          case 'mystery':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "9648", sort_by: "popularity.desc" }),
            ];
            break;
          case 'western':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "37", sort_by: "popularity.desc" }),
            ];
            break;
          case 'oscar':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { 
                page, 
                sort_by: "vote_average.desc",
                "vote_count.gte": "2000",
                "vote_average.gte": "8"
              }),
            ];
            break;
          case 'palme':
          case 'golden_globe':
          case 'bafta':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { 
                page, 
                sort_by: "vote_average.desc",
                "vote_count.gte": "500",
                "vote_average.gte": "7.5"
              }),
            ];
            break;
          case 'french':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "fr", sort_by: "popularity.desc" }),
            ];
            break;
          case 'korean':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "ko", sort_by: "popularity.desc" }),
            ];
            break;
          case 'kdrama':
            smartSources = [
              fetchTMDB("/discover/tv", apiKey, { page, with_original_language: "ko", sort_by: "popularity.desc" }),
              fetchTMDB("/discover/tv", apiKey, { page, with_origin_country: "KR", with_genres: "18", sort_by: "popularity.desc" }),
            ];
            break;
          case 'japanese':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "ja", sort_by: "popularity.desc" }),
            ];
            break;
          case 'bollywood':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "hi", sort_by: "popularity.desc" }),
            ];
            break;
          case 'spanish':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "es", sort_by: "popularity.desc" }),
            ];
            break;
          case 'latino':
            smartSources = [
              fetchTMDB("/discover/tv", apiKey, { page, with_original_language: "es", sort_by: "popularity.desc" }),
              fetchTMDB("/discover/tv", apiKey, { page, with_origin_country: "CO", sort_by: "popularity.desc" }),
              fetchTMDB("/discover/tv", apiKey, { page, with_origin_country: "MX", sort_by: "popularity.desc" }),
            ];
            break;
          case 'turkish':
            smartSources = [
              fetchTMDB("/discover/tv", apiKey, { page, with_original_language: "tr", sort_by: "popularity.desc" }),
            ];
            break;
          case 'chinese':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "zh", sort_by: "popularity.desc" }),
            ];
            break;
          case 'british':
            smartSources = [
              fetchTMDB("/discover/tv", apiKey, { page, with_origin_country: "GB", sort_by: "popularity.desc" }),
            ];
            break;
          case 'italian':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "it", sort_by: "popularity.desc" }),
            ];
            break;
          case 'german':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "de", sort_by: "popularity.desc" }),
            ];
            break;
          case 'arabic':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "ar", sort_by: "popularity.desc" }),
            ];
            break;
          case 'thai':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "th", sort_by: "popularity.desc" }),
            ];
            break;
          case 'vietnamese':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_original_language: "vi", sort_by: "popularity.desc" }),
            ];
            break;
          case 'christmas':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_keywords: "207317", sort_by: "popularity.desc" }),
            ];
            break;
          case 'halloween':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "27", sort_by: "popularity.desc" }),
            ];
            break;
          case 'superhero':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_keywords: "9715", sort_by: "popularity.desc" }),
            ];
            break;
          case 'sports':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_keywords: "6075", sort_by: "popularity.desc" }),
            ];
            break;
          case 'biography':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_keywords: "9672", sort_by: "popularity.desc" }),
            ];
            break;
          case 'historical':
            smartSources = [
              fetchTMDB("/discover/movie", apiKey, { page, with_genres: "36", sort_by: "popularity.desc" }),
            ];
            break;
          default:
            smartSources = [fetchTMDB("/movie/popular", apiKey, { page })];
        }
      }

      if (smartSources.length > 0) {
        const results = await Promise.all(smartSources);
        const seenIds = new Set<string>();
        const movieIds: number[] = [];

        for (const result of results) {
          for (const item of result.results || []) {
            if (!item.poster_path) continue;
            const isSeries = item.name !== undefined;
            const media = isSeries 
              ? transformSeries(item, undefined, smartCollectionType)
              : transformMovie(item, undefined, smartCollectionType);
            if (!seenIds.has(media.id)) {
              seenIds.add(media.id);
              data.push(media);
              if (!isSeries) movieIds.push(item.id);
            }
          }
          totalPages = Math.max(totalPages, Math.min(result.total_pages || 1, 500));
        }

        // Fetch collection info for movies
        if (withCollections && movieIds.length > 0) {
          const collectionPromises = movieIds.slice(0, 30).map(id => getMovieDetails(id, apiKey));
          const collectionResults = await Promise.all(collectionPromises);
          let collectionIndex = 0;
          data = data.map(item => {
            if (item.type === 'movie' && collectionIndex < collectionResults.length) {
              const collectionInfo = collectionResults[collectionIndex++];
              if (collectionInfo) {
                return { ...item, ...collectionInfo };
              }
            }
            return item;
          });
        }
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
    // Full catalog mode
    else {
      const sourceIndex = (pageNum - 1) % 20;
      
      if (category === "movies") {
        const allMovieSources = [
          () => fetchTMDB("/movie/popular", apiKey, { page }),
          () => fetchTMDB("/movie/top_rated", apiKey, { page }),
          () => fetchTMDB("/movie/now_playing", apiKey, { page }),
          () => fetchTMDB("/movie/upcoming", apiKey, { page }),
          () => fetchTMDB("/trending/movie/day", apiKey, { page }),
          () => fetchTMDB("/trending/movie/week", apiKey, { page }),
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
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "fr", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "ko", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { with_original_language: "ja", page, sort_by: "popularity.desc" }),
          () => fetchTMDB("/discover/movie", apiKey, { page, sort_by: "revenue.desc", "vote_count.gte": "100" }),
        ];

        const sourcesToUse = [
          ...allMovieSources.slice(0, 6),
          ...allMovieSources.slice(6 + (sourceIndex % 8), 6 + (sourceIndex % 8) + 4),
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

        // Fetch collection info for ALL movies to ensure proper grouping
        if (withCollections && movieItems.length > 0) {
          const collectionPromises = movieItems.map(m => getMovieDetails(m.item.id, apiKey));
          const collectionResults = await Promise.all(collectionPromises);
          
          movieItems.forEach((item, index) => {
            if (collectionResults[index]) {
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
          fetchTMDB("/discover/tv", apiKey, { with_genres: "18", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_genres: "35", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "ko", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_original_language: "es", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "CO", page, sort_by: "popularity.desc" }),
          fetchTMDB("/discover/tv", apiKey, { with_origin_country: "TR", page, sort_by: "popularity.desc" }),
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