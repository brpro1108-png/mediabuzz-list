import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem, SMART_COLLECTIONS } from '@/types/media';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Generate all box office years
const BOX_OFFICE_YEARS = Array.from({ length: 36 }, (_, i) => `box_office_${2025 - i}`);

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

  // Fetch smart collection
  const fetchSmartCollection = useCallback(async (collectionId: string, page = 1): Promise<MediaItem[]> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
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
      
      // Load smart collections in background - prioritize most important ones
      const priorityCollections = [
        'trending', 'now_playing', 'upcoming', 'top_rated',
        // Famous sagas
        'harrypotter', 'lotr', 'hobbit', 'starwars', 'bond', 'fast', 'jurassic', 'mission', 'avengers', 'matrix',
        // Box office recent years
        'box_office_2025', 'box_office_2024', 'box_office_2023', 'box_office_2022', 'box_office_2021', 'box_office_2020',
        // Studios
        'marvel', 'dc', 'disney', 'pixar', 'dreamworks', 'ghibli', 'warner', 'universal',
        // Platforms
        'netflix', 'disneyplus', 'hbo', 'prime', 'appletv',
        // International
        'kdrama', 'french', 'korean', 'japanese',
      ];
      
      const smartResults: Record<string, MediaItem[]> = {};
      
      // Fetch priority collections in batches
      for (let i = 0; i < priorityCollections.length; i += 5) {
        const batch = priorityCollections.slice(i, i + 5);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        batch.forEach((id, idx) => {
          smartResults[id] = results[idx];
        });
        setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
      // Load remaining collections (box office years, more sagas, etc.)
      const allCollectionIds = [
        ...BOX_OFFICE_YEARS,
        ...Object.keys(SMART_COLLECTIONS),
      ];
      const remainingCollections = allCollectionIds.filter(id => !priorityCollections.includes(id));
      
      for (let i = 0; i < remainingCollections.length; i += 6) {
        const batch = remainingCollections.slice(i, i + 6);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        batch.forEach((id, idx) => {
          smartResults[id] = results[idx];
        });
        setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
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
      
      // Refresh smart collections
      const collectionsToRefresh = ['trending', 'now_playing', 'upcoming', 'box_office_2025', 'box_office_2024'];
      for (const id of collectionsToRefresh) {
        const results = await fetchSmartCollection(id);
        setSmartCollections(prev => ({ ...prev, [id]: results }));
      }
      
      setLastUpdate(new Date());
      console.log(`✅ Major update complete. Pages: ${loadedPages.current.movies}`);
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
    isLoading,
    error,
    refetch: loadInitialData,
    searchTMDB,
    lastUpdate,
    isAutoUpdating,
    pagesLoaded: loadedPages.current.movies,
  };
}