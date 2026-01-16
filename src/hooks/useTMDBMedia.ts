import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, SMART_COLLECTIONS } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Local storage keys for media cache
const CACHE_KEYS = {
  movies: 'tmdb-cache-movies',
  series: 'tmdb-cache-series',
  animes: 'tmdb-cache-animes',
  docs: 'tmdb-cache-docs',
  loadState: 'tmdb-load-state',
  smartCollections: 'tmdb-cache-smart',
  seriesCollections: 'tmdb-cache-series-collections',
};

// Generate all box office years
const BOX_OFFICE_YEARS = Array.from({ length: 36 }, (_, i) => `box_office_${2025 - i}`);

// All movie collections
const ALL_MOVIE_COLLECTIONS = [
  'trending', 'now_playing', 'upcoming', 'top_rated',
  ...BOX_OFFICE_YEARS,
  'harrypotter', 'lotr', 'hobbit', 'starwars', 'bond', 'fast', 'jurassic', 'transformers', 'mission', 'pirates', 'matrix', 'avengers', 'xmen', 'batman', 'spiderman', 'iceage', 'shrek', 'toystory', 'despicableme', 'hungergames', 'twilight', 'indianajones', 'alien', 'terminator', 'rocky', 'diehard', 'bourne', 'johnwick', 'godfather', 'backtothefuture', 'madmax',
  'marvel', 'dc', 'disney', 'pixar', 'ghibli', 'dreamworks', 'warner', 'universal', 'paramount', 'sony', 'lionsgate', 'fox', 'mgm',
  'action', 'comedy', 'horror', 'romance', 'scifi', 'thriller', 'family', 'classics', 'war', 'musicals', 'animation', 'adventure', 'crime', 'mystery', 'western',
  'oscar', 'palme', 'golden_globe', 'bafta',
  'french', 'korean', 'kdrama', 'japanese', 'bollywood', 'spanish', 'latino', 'turkish', 'chinese', 'british', 'italian', 'german', 'arabic', 'thai', 'vietnamese',
  'netflix', 'disneyplus', 'hbo', 'prime', 'appletv', 'hulu', 'peacock', 'paramount_plus', 'showtime', 'starz',
  'christmas', 'halloween', 'superhero', 'sports', 'biography', 'historical',
];

// All series collections
const ALL_SERIES_COLLECTIONS = [
  'series_trending', 'series_popular', 'series_top_rated', 'series_airing', 'series_new',
  'kdrama_popular', 'kdrama_romance', 'kdrama_thriller', 'kdrama_historical', 'kdrama_fantasy',
  'netflix_series', 'disney_series', 'hbo_series', 'prime_series', 'apple_series', 'paramount_series',
  'turkish_series', 'spanish_series', 'british_series', 'french_series', 'japanese_series', 'latino_series', 'chinese_series',
  'series_drama', 'series_comedy', 'series_crime', 'series_scifi', 'series_fantasy', 'series_horror', 'series_thriller', 'series_action', 'series_mystery', 'series_romance',
  'series_classic', 'series_sitcom', 'series_medical', 'series_legal', 'series_teen',
  'anime_popular', 'anime_action', 'anime_romance', 'anime_fantasy', 'cartoon_series',
];

// Number of pages to fetch per collection (more pages = more content)
const PAGES_PER_COLLECTION = 10;

interface LoadState {
  movies: number;
  series: number;
  animes: number;
  docs: number;
}

// Helper to load from localStorage
const loadFromCache = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to load cache ${key}:`, e);
  }
  return null;
};

// Helper to save to localStorage
const saveToCache = (key: string, data: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save cache ${key}:`, e);
  }
};

export function useTMDBMedia() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [animes, setAnimes] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<MediaItem[]>([]);
  const [smartCollections, setSmartCollections] = useState<Record<string, MediaItem[]>>({});
  const [seriesCollections, setSeriesCollections] = useState<Record<string, MediaItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  
  const loadedPages = useRef<LoadState>({ movies: 0, series: 0, animes: 0, docs: 0 });
  const seenIds = useRef(new Set<string>());
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fastUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to database
  const saveStateToDatabase = useCallback(async (state: LoadState) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('media_load_state')
        .upsert({
          user_id: user.id,
          movies_pages: state.movies,
          series_pages: state.series,
          animes_pages: state.animes,
          docs_pages: state.docs,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) console.error('Error saving load state:', error);
    } catch (e) {
      console.error('Failed to save state to database:', e);
    }
  }, [user]);

  // Debounced save
  const debouncedSave = useCallback((state: LoadState) => {
    saveToCache(CACHE_KEYS.loadState, state);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveStateToDatabase(state);
    }, 3000);
  }, [saveStateToDatabase]);

  // Save media cache periodically
  const saveMediaCache = useCallback(() => {
    saveToCache(CACHE_KEYS.movies, movies);
    saveToCache(CACHE_KEYS.series, series);
    saveToCache(CACHE_KEYS.animes, animes);
    saveToCache(CACHE_KEYS.docs, docs);
    saveToCache(CACHE_KEYS.smartCollections, smartCollections);
    saveToCache(CACHE_KEYS.seriesCollections, seriesCollections);
  }, [movies, series, animes, docs, smartCollections, seriesCollections]);

  // Optimized fetch with timeout
  const fetchPage = useCallback(async (category: string, page: number, withCollections = false): Promise<MediaItem[]> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const url = `${SUPABASE_URL}/functions/v1/tmdb-api?category=${category}&page=${page}${withCollections ? '&collections=true' : ''}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.filter((item: MediaItem) => {
          if (seenIds.current.has(item.id)) return false;
          seenIds.current.add(item.id);
          return true;
        });
      }
      return [];
    } catch (err) {
      console.error(`Error fetching ${category} page ${page}:`, err);
      return [];
    }
  }, []);

  // Fetch smart collection with multiple pages
  const fetchSmartCollection = useCallback(async (collectionId: string): Promise<MediaItem[]> => {
    try {
      const allItems: MediaItem[] = [];
      const seenCollectionIds = new Set<string>();

      for (let page = 1; page <= PAGES_PER_COLLECTION; page++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const url = `${SUPABASE_URL}/functions/v1/tmdb-api?category=movies&smart=${collectionId}&page=${page}&collections=true`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        const result = await response.json();
        if (result.success && result.data) {
          for (const item of result.data) {
            if (!seenCollectionIds.has(item.id)) {
              seenCollectionIds.add(item.id);
              allItems.push(item);
            }
          }
        }
      }
      
      return allItems;
    } catch (err) {
      console.error(`Error fetching smart collection ${collectionId}:`, err);
      return [];
    }
  }, []);

  // Fetch series collection with multiple pages
  const fetchSeriesCollection = useCallback(async (collectionId: string): Promise<MediaItem[]> => {
    try {
      const allItems: MediaItem[] = [];
      const seenCollectionIds = new Set<string>();

      for (let page = 1; page <= PAGES_PER_COLLECTION; page++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const url = `${SUPABASE_URL}/functions/v1/tmdb-api?category=series&smart=${collectionId}&page=${page}`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        const result = await response.json();
        if (result.success && result.data) {
          for (const item of result.data) {
            if (!seenCollectionIds.has(item.id)) {
              seenCollectionIds.add(item.id);
              allItems.push(item);
            }
          }
        }
      }
      
      return allItems;
    } catch (err) {
      console.error(`Error fetching series collection ${collectionId}:`, err);
      return [];
    }
  }, []);

  // Load initial data with cache restoration
  const loadInitialData = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    setIsLoading(true);
    setError(null);

    // First: Load from localStorage cache immediately
    const cachedMovies = loadFromCache<MediaItem[]>(CACHE_KEYS.movies);
    const cachedSeries = loadFromCache<MediaItem[]>(CACHE_KEYS.series);
    const cachedAnimes = loadFromCache<MediaItem[]>(CACHE_KEYS.animes);
    const cachedDocs = loadFromCache<MediaItem[]>(CACHE_KEYS.docs);
    const cachedLoadState = loadFromCache<LoadState>(CACHE_KEYS.loadState);
    const cachedSmartCollections = loadFromCache<Record<string, MediaItem[]>>(CACHE_KEYS.smartCollections);
    const cachedSeriesCollections = loadFromCache<Record<string, MediaItem[]>>(CACHE_KEYS.seriesCollections);

    // Restore cached data if available
    if (cachedMovies?.length) {
      setMovies(cachedMovies);
      cachedMovies.forEach(m => seenIds.current.add(m.id));
    }
    if (cachedSeries?.length) {
      setSeries(cachedSeries);
      cachedSeries.forEach(s => seenIds.current.add(s.id));
    }
    if (cachedAnimes?.length) {
      setAnimes(cachedAnimes);
      cachedAnimes.forEach(a => seenIds.current.add(a.id));
    }
    if (cachedDocs?.length) {
      setDocs(cachedDocs);
      cachedDocs.forEach(d => seenIds.current.add(d.id));
    }
    if (cachedSmartCollections) {
      setSmartCollections(cachedSmartCollections);
    }
    if (cachedSeriesCollections) {
      setSeriesCollections(cachedSeriesCollections);
    }
    
    // Restore load state
    if (cachedLoadState) {
      loadedPages.current = cachedLoadState;
    }

    // If user is logged in, try to get state from database
    if (user) {
      try {
        const { data, error: dbError } = await supabase
          .from('media_load_state')
          .select('movies_pages, series_pages, animes_pages, docs_pages')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!dbError && data) {
          const dbState = {
            movies: data.movies_pages,
            series: data.series_pages,
            animes: data.animes_pages,
            docs: data.docs_pages,
          };
          // Use the maximum of local and database state
          loadedPages.current = {
            movies: Math.max(loadedPages.current.movies, dbState.movies),
            series: Math.max(loadedPages.current.series, dbState.series),
            animes: Math.max(loadedPages.current.animes, dbState.animes),
            docs: Math.max(loadedPages.current.docs, dbState.docs),
          };
        }
      } catch (e) {
        console.error('Failed to load state from database:', e);
      }
    }

    // If we have cached data, mark as not loading
    if (cachedMovies?.length || cachedSeries?.length) {
      setIsLoading(false);
      console.log(`✅ Restored from cache: ${cachedMovies?.length || 0} movies, ${cachedSeries?.length || 0} series, Pages: ${loadedPages.current.movies}`);
    }

    try {
      // Determine starting page (resume from where we left off)
      const startPage = loadedPages.current.movies + 1;
      
      // If no cache, load first 8 pages quickly
      if (startPage <= 1) {
        const pagesToLoad = [1, 2, 3, 4, 5, 6, 7, 8];
        
        const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
          Promise.all(pagesToLoad.map(p => fetchPage('movies', p, true))),
          Promise.all(pagesToLoad.map(p => fetchPage('series', p))),
          Promise.all(pagesToLoad.map(p => fetchPage('animes', p))),
          Promise.all(pagesToLoad.map(p => fetchPage('docs', p))),
        ]);

        setMovies(prev => [...prev, ...movieResults.flat()]);
        setSeries(prev => [...prev, ...seriesResults.flat()]);
        setAnimes(prev => [...prev, ...animeResults.flat()]);
        setDocs(prev => [...prev, ...docResults.flat()]);
        
        loadedPages.current = { movies: 8, series: 8, animes: 8, docs: 8 };
        debouncedSave(loadedPages.current);
      }
      
      setIsLoading(false);
      
      // Load smart collections if not cached
      if (!cachedSmartCollections || Object.keys(cachedSmartCollections).length === 0) {
        const priorityMovieCollections = [
          'trending', 'now_playing', 'upcoming', 'top_rated',
          'harrypotter', 'lotr', 'starwars', 'marvel', 'dc',
          'box_office_2025', 'box_office_2024', 'box_office_2023',
          'netflix', 'disney', 'pixar', 'dreamworks',
        ];
        
        for (let i = 0; i < priorityMovieCollections.length; i += 3) {
          const batch = priorityMovieCollections.slice(i, i + 3);
          const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
          setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
        }
      }
      
      if (!cachedSeriesCollections || Object.keys(cachedSeriesCollections).length === 0) {
        const prioritySeriesCollections = [
          'series_trending', 'series_popular', 'series_top_rated', 'series_airing',
          'kdrama_popular', 'kdrama_romance',
          'netflix_series', 'disney_series', 'hbo_series', 'prime_series',
          'turkish_series', 'british_series', 'french_series',
          'series_drama', 'series_comedy', 'series_crime',
        ];
        
        for (let i = 0; i < prioritySeriesCollections.length; i += 3) {
          const batch = prioritySeriesCollections.slice(i, i + 3);
          const results = await Promise.all(batch.map(id => fetchSeriesCollection(id)));
          setSeriesCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
        }
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, fetchSmartCollection, fetchSeriesCollection, debouncedSave, user]);

  // Fast background fetch - runs every 1 second
  const fetchMorePagesFast = useCallback(async () => {
    const currentMax = loadedPages.current.movies;
    const newPage = currentMax + 1;
    
    try {
      const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
        fetchPage('movies', newPage, true),
        fetchPage('series', newPage),
        fetchPage('animes', newPage),
        fetchPage('docs', newPage),
      ]);

      if (movieResults.length > 0) setMovies(prev => [...prev, ...movieResults]);
      if (seriesResults.length > 0) setSeries(prev => [...prev, ...seriesResults]);
      if (animeResults.length > 0) setAnimes(prev => [...prev, ...animeResults]);
      if (docResults.length > 0) setDocs(prev => [...prev, ...docResults]);
      
      loadedPages.current = {
        movies: newPage,
        series: newPage,
        animes: newPage,
        docs: newPage,
      };
      
      // Save state after each page load
      debouncedSave(loadedPages.current);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Fast update error:', err);
    }
  }, [fetchPage, debouncedSave]);

  // Major update - runs every 30 minutes
  const performMajorUpdate = useCallback(async () => {
    if (isAutoUpdating) return;
    
    setIsAutoUpdating(true);
    console.log('🔄 Major update: fetching more content...');
    
    try {
      const currentMax = loadedPages.current.movies;
      
      for (let i = 0; i < 10; i++) {
        const newPage = currentMax + 1 + i;
        
        const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
          fetchPage('movies', newPage, true),
          fetchPage('series', newPage),
          fetchPage('animes', newPage),
          fetchPage('docs', newPage),
        ]);

        if (movieResults.length > 0) setMovies(prev => [...prev, ...movieResults]);
        if (seriesResults.length > 0) setSeries(prev => [...prev, ...seriesResults]);
        if (animeResults.length > 0) setAnimes(prev => [...prev, ...animeResults]);
        if (docResults.length > 0) setDocs(prev => [...prev, ...docResults]);
        
        loadedPages.current = {
          movies: newPage,
          series: newPage,
          animes: newPage,
          docs: newPage,
        };
        
        await new Promise(r => setTimeout(r, 100));
      }
      
      debouncedSave(loadedPages.current);
      
      // Refresh smart collections with more pages
      const movieCollectionsToRefresh = ['trending', 'now_playing', 'upcoming', 'box_office_2025'];
      for (const id of movieCollectionsToRefresh) {
        const results = await fetchSmartCollection(id);
        setSmartCollections(prev => ({ ...prev, [id]: results }));
      }
      
      const seriesCollectionsToRefresh = ['series_trending', 'series_popular', 'series_airing'];
      for (const id of seriesCollectionsToRefresh) {
        const results = await fetchSeriesCollection(id);
        setSeriesCollections(prev => ({ ...prev, [id]: results }));
      }
      
      setLastUpdate(new Date());
      console.log(`✅ Major update complete. Pages: ${loadedPages.current.movies}`);
    } catch (err) {
      console.error('Major update error:', err);
    } finally {
      setIsAutoUpdating(false);
    }
  }, [fetchPage, fetchSmartCollection, fetchSeriesCollection, isAutoUpdating, debouncedSave]);

  // Real-time TMDB search
  const searchTMDB = useCallback(async (query: string, category: 'movies' | 'series'): Promise<MediaItem[]> => {
    if (!query.trim()) return [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tmdb-api?category=${category}&search=${encodeURIComponent(query)}&page=1&collections=true`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      
      const result = await response.json();
      return result.success && result.data ? result.data : [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, []);

  // Save cache periodically
  useEffect(() => {
    const interval = setInterval(saveMediaCache, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [saveMediaCache]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveMediaCache();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [saveMediaCache]);

  useEffect(() => {
    loadInitialData();
    
    // Fast update every 1 second for rapid media loading
    fastUpdateRef.current = setInterval(fetchMorePagesFast, 1000);
    
    // Major update every 30 minutes
    updateIntervalRef.current = setInterval(performMajorUpdate, 30 * 60 * 1000);
    
    return () => {
      if (fastUpdateRef.current) clearInterval(fastUpdateRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [loadInitialData, fetchMorePagesFast, performMajorUpdate]);

  return {
    movies,
    series,
    animes,
    docs,
    smartCollections,
    seriesCollections,
    isLoading,
    error,
    refetch: loadInitialData,
    searchTMDB,
    lastUpdate,
    isAutoUpdating,
    pagesLoaded: loadedPages.current.movies,
  };
}