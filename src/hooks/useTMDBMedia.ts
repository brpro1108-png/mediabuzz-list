import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, SMART_COLLECTIONS } from '@/types/media';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

export function useTMDBMedia() {
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
  
  const loadedPages = useRef({ movies: 0, series: 0, animes: 0, docs: 0 });
  const seenIds = useRef(new Set<string>());
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fastUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

      // Fetch multiple pages for each collection
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

      // Fetch multiple pages for each collection
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

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    seenIds.current.clear();
    loadedPages.current = { movies: 0, series: 0, animes: 0, docs: 0 };
    setMovies([]);
    setSeries([]);
    setAnimes([]);
    setDocs([]);

    try {
      // Load first 8 pages quickly with collections
      const pagesToLoad = [1, 2, 3, 4, 5, 6, 7, 8];
      
      const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
        Promise.all(pagesToLoad.map(p => fetchPage('movies', p, true))),
        Promise.all(pagesToLoad.map(p => fetchPage('series', p))),
        Promise.all(pagesToLoad.map(p => fetchPage('animes', p))),
        Promise.all(pagesToLoad.map(p => fetchPage('docs', p))),
      ]);

      setMovies(movieResults.flat());
      setSeries(seriesResults.flat());
      setAnimes(animeResults.flat());
      setDocs(docResults.flat());
      
      loadedPages.current = { movies: 8, series: 8, animes: 8, docs: 8 };
      setIsLoading(false);
      
      // Load MOVIE smart collections in background
      const priorityMovieCollections = [
        'trending', 'now_playing', 'upcoming', 'top_rated',
        'harrypotter', 'lotr', 'starwars', 'marvel', 'dc',
        'box_office_2025', 'box_office_2024', 'box_office_2023',
        'netflix', 'disney', 'pixar', 'dreamworks',
      ];
      
      // Fetch priority movie collections
      for (let i = 0; i < priorityMovieCollections.length; i += 3) {
        const batch = priorityMovieCollections.slice(i, i + 3);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
      // Load SERIES collections in background
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
      
      // Load remaining movie collections
      const remainingMovieCollections = ALL_MOVIE_COLLECTIONS.filter(id => !priorityMovieCollections.includes(id));
      for (let i = 0; i < remainingMovieCollections.length; i += 4) {
        const batch = remainingMovieCollections.slice(i, i + 4);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
      // Load remaining series collections
      const remainingSeriesCollections = ALL_SERIES_COLLECTIONS.filter(id => !prioritySeriesCollections.includes(id));
      for (let i = 0; i < remainingSeriesCollections.length; i += 4) {
        const batch = remainingSeriesCollections.slice(i, i + 4);
        const results = await Promise.all(batch.map(id => fetchSeriesCollection(id)));
        setSeriesCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, fetchSmartCollection, fetchSeriesCollection]);

  // Fast background fetch - runs every 5 seconds
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
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Fast update error:', err);
    }
  }, [fetchPage]);

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
  }, [fetchPage, fetchSmartCollection, fetchSeriesCollection, isAutoUpdating]);

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

  useEffect(() => {
    loadInitialData();
    
    // Fast update every 5 seconds
    fastUpdateRef.current = setInterval(fetchMorePagesFast, 5 * 1000);
    
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