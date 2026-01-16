import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, SMART_COLLECTIONS } from '@/types/media';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useTMDBMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [animes, setAnimes] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<MediaItem[]>([]);
  const [smartCollections, setSmartCollections] = useState<Record<string, MediaItem[]>>({});
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
      const timeout = setTimeout(() => controller.abort(), 10000);
      
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

  // Fetch smart collection
  const fetchSmartCollection = useCallback(async (collectionId: string, page = 1): Promise<MediaItem[]> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const url = `${SUPABASE_URL}/functions/v1/tmdb-api?category=movies&smart=${collectionId}&page=${page}&collections=true`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      const result = await response.json();
      return result.success && result.data ? result.data : [];
    } catch (err) {
      console.error(`Error fetching smart collection ${collectionId}:`, err);
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
      // Load first 8 pages quickly
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
      
      // Load smart collections in background
      const smartCollectionIds = Object.keys(SMART_COLLECTIONS);
      const smartResults: Record<string, MediaItem[]> = {};
      
      for (let i = 0; i < smartCollectionIds.length; i += 4) {
        const batch = smartCollectionIds.slice(i, i + 4);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        batch.forEach((id, idx) => {
          smartResults[id] = results[idx];
        });
      }
      
      setSmartCollections(smartResults);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, fetchSmartCollection]);

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
      // Fetch 10 new pages
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
      
      // Update smart collections
      const smartCollectionIds = Object.keys(SMART_COLLECTIONS);
      for (const id of smartCollectionIds.slice(0, 5)) {
        const results = await fetchSmartCollection(id, 2);
        setSmartCollections(prev => ({
          ...prev,
          [id]: [...(prev[id] || []), ...results.filter(r => !prev[id]?.some(p => p.id === r.id))],
        }));
      }
      
      setLastUpdate(new Date());
      console.log(`✅ Major update complete. Pages loaded: ${loadedPages.current.movies}`);
    } catch (err) {
      console.error('Major update error:', err);
    } finally {
      setIsAutoUpdating(false);
    }
  }, [fetchPage, fetchSmartCollection, isAutoUpdating]);

  // Real-time TMDB search
  const searchTMDB = useCallback(async (query: string, category: 'movies' | 'series'): Promise<MediaItem[]> => {
    if (!query.trim()) return [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
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
    isLoading,
    error,
    refetch: loadInitialData,
    searchTMDB,
    lastUpdate,
    isAutoUpdating,
    pagesLoaded: loadedPages.current.movies,
  };
}