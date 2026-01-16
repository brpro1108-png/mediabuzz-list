import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem } from '@/types/media';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useTMDBMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [animes, setAnimes] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  
  const currentPage = useRef(1);
  const seenIds = useRef(new Set<string>());
  const autoUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const continuousUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Optimized fetch with timeout and retry
  const fetchPage = useCallback(async (category: string, page: number, retries = 2): Promise<MediaItem[]> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tmdb-api?category=${category}&page=${page}`,
        { signal: controller.signal }
      );
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
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchPage(category, page, retries - 1);
      }
      console.error(`Error fetching ${category} page ${page}:`, err);
      return [];
    }
  }, []);

  // Load initial data with batched requests to reduce latency
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    seenIds.current.clear();
    currentPage.current = 1;

    try {
      // Load in smaller batches to improve perceived performance
      const batchSize = 5;
      const totalBatches = 4; // 20 pages total but in batches
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const startPage = batch * batchSize + 1;
        const pages = Array.from({ length: batchSize }, (_, i) => startPage + i);
        
        const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
          Promise.all(pages.map(p => fetchPage('movies', p))),
          Promise.all(pages.map(p => fetchPage('series', p))),
          Promise.all(pages.map(p => fetchPage('animes', p))),
          Promise.all(pages.map(p => fetchPage('docs', p))),
        ]);

        setMovies(prev => [...prev, ...movieResults.flat()]);
        setSeries(prev => [...prev, ...seriesResults.flat()]);
        setAnimes(prev => [...prev, ...animeResults.flat()]);
        setDocs(prev => [...prev, ...docResults.flat()]);
        
        // Show content after first batch
        if (batch === 0) setIsLoading(false);
        
        currentPage.current = startPage + batchSize - 1;
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage.current + 1;

    try {
      const pagesToLoad = 3; // Reduced for faster response
      const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
        Promise.all(Array.from({ length: pagesToLoad }, (_, i) => fetchPage('movies', nextPage + i))),
        Promise.all(Array.from({ length: pagesToLoad }, (_, i) => fetchPage('series', nextPage + i))),
        Promise.all(Array.from({ length: pagesToLoad }, (_, i) => fetchPage('animes', nextPage + i))),
        Promise.all(Array.from({ length: pagesToLoad }, (_, i) => fetchPage('docs', nextPage + i))),
      ]);

      const newMovies = movieResults.flat();
      const newSeries = seriesResults.flat();
      const newAnimes = animeResults.flat();
      const newDocs = docResults.flat();

      if (newMovies.length === 0 && newSeries.length === 0 && newAnimes.length === 0 && newDocs.length === 0) {
        setHasMore(false);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
        setSeries(prev => [...prev, ...newSeries]);
        setAnimes(prev => [...prev, ...newAnimes]);
        setDocs(prev => [...prev, ...newDocs]);
        currentPage.current = nextPage + pagesToLoad - 1;
      }
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, fetchPage]);

  // Real-time TMDB search - returns results directly
  const searchTMDB = useCallback(async (query: string, category: 'movies' | 'series'): Promise<MediaItem[]> => {
    if (!query.trim()) return [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tmdb-api?category=${category}&search=${encodeURIComponent(query)}&page=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, []);

  // Continuous auto-update that keeps fetching until all content is loaded
  const performAutoUpdate = useCallback(async () => {
    if (isAutoUpdating) return;
    
    setIsAutoUpdating(true);
    console.log('🔄 Auto-update started - fetching missing content...');
    
    try {
      // Fetch multiple pages in sequence to get more content
      const pagesToFetch = 10;
      let newContentAdded = 0;
      
      for (let i = 0; i < pagesToFetch; i++) {
        const newPage = currentPage.current + 1 + i;
        
        const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
          fetchPage('movies', newPage),
          fetchPage('series', newPage),
          fetchPage('animes', newPage),
          fetchPage('docs', newPage),
        ]);

        if (movieResults.length > 0) {
          setMovies(prev => [...prev, ...movieResults]);
          newContentAdded += movieResults.length;
        }
        if (seriesResults.length > 0) {
          setSeries(prev => [...prev, ...seriesResults]);
          newContentAdded += seriesResults.length;
        }
        if (animeResults.length > 0) {
          setAnimes(prev => [...prev, ...animeResults]);
          newContentAdded += animeResults.length;
        }
        if (docResults.length > 0) {
          setDocs(prev => [...prev, ...docResults]);
          newContentAdded += docResults.length;
        }
        
        // Small delay between batches to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
      
      currentPage.current += pagesToFetch;
      setLastUpdate(new Date());
      console.log(`✅ Auto-update complete: ${newContentAdded} new items added. Total pages: ${currentPage.current}`);
    } catch (err) {
      console.error('Auto-update error:', err);
    } finally {
      setIsAutoUpdating(false);
    }
  }, [fetchPage, isAutoUpdating]);

  useEffect(() => {
    loadInitialData();
    
    // Auto-update every hour
    autoUpdateInterval.current = setInterval(performAutoUpdate, 60 * 60 * 1000);
    
    // Also do a continuous background update every 5 minutes to catch up faster
    continuousUpdateRef.current = setInterval(() => {
      if (currentPage.current < 100) { // Keep fetching until we have 100+ pages
        performAutoUpdate();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      if (autoUpdateInterval.current) clearInterval(autoUpdateInterval.current);
      if (continuousUpdateRef.current) clearInterval(continuousUpdateRef.current);
    };
  }, [loadInitialData, performAutoUpdate]);

  return {
    movies,
    series,
    animes,
    docs,
    isLoading,
    isLoadingMore,
    error,
    refetch: loadInitialData,
    loadMore,
    hasMore,
    searchTMDB,
    lastUpdate,
    isAutoUpdating,
    currentPage: currentPage.current,
  };
}
