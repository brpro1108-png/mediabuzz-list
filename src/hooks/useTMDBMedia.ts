import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem } from '@/types/media';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useTMDBMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [animes, setAnimes] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  
  const loadedPages = useRef({ movies: 0, series: 0, animes: 0, docs: 0 });
  const seenIds = useRef(new Set<string>());
  const autoUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Optimized fetch with timeout
  const fetchPage = useCallback(async (category: string, page: number, withCollections = false): Promise<MediaItem[]> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      
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

  // Load initial data - fewer pages for faster startup
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
      // Load first 10 pages quickly
      const initialPages = 10;
      
      for (let batch = 0; batch < 2; batch++) {
        const startPage = batch * 5 + 1;
        const pages = [startPage, startPage + 1, startPage + 2, startPage + 3, startPage + 4];
        
        const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
          Promise.all(pages.map(p => fetchPage('movies', p, true))),
          Promise.all(pages.map(p => fetchPage('series', p))),
          Promise.all(pages.map(p => fetchPage('animes', p))),
          Promise.all(pages.map(p => fetchPage('docs', p))),
        ]);

        setMovies(prev => [...prev, ...movieResults.flat()]);
        setSeries(prev => [...prev, ...seriesResults.flat()]);
        setAnimes(prev => [...prev, ...animeResults.flat()]);
        setDocs(prev => [...prev, ...docResults.flat()]);
        
        if (batch === 0) setIsLoading(false);
        
        loadedPages.current = {
          movies: startPage + 4,
          series: startPage + 4,
          animes: startPage + 4,
          docs: startPage + 4,
        };
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  // Background fetch more pages
  const fetchMorePages = useCallback(async (pagesToFetch = 5) => {
    const currentMax = Math.max(
      loadedPages.current.movies,
      loadedPages.current.series,
      loadedPages.current.animes,
      loadedPages.current.docs
    );
    
    let newContentCount = 0;
    
    for (let i = 0; i < pagesToFetch; i++) {
      const newPage = currentMax + 1 + i;
      
      const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
        fetchPage('movies', newPage, true),
        fetchPage('series', newPage),
        fetchPage('animes', newPage),
        fetchPage('docs', newPage),
      ]);

      if (movieResults.length > 0) {
        setMovies(prev => [...prev, ...movieResults]);
        newContentCount += movieResults.length;
      }
      if (seriesResults.length > 0) {
        setSeries(prev => [...prev, ...seriesResults]);
        newContentCount += seriesResults.length;
      }
      if (animeResults.length > 0) {
        setAnimes(prev => [...prev, ...animeResults]);
        newContentCount += animeResults.length;
      }
      if (docResults.length > 0) {
        setDocs(prev => [...prev, ...docResults]);
        newContentCount += docResults.length;
      }
      
      loadedPages.current = {
        movies: newPage,
        series: newPage,
        animes: newPage,
        docs: newPage,
      };
      
      // Small delay between pages to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
    
    return newContentCount;
  }, [fetchPage]);

  // Auto-update that continuously fetches more content
  const performAutoUpdate = useCallback(async () => {
    if (isAutoUpdating) return;
    
    setIsAutoUpdating(true);
    console.log('🔄 Auto-update: fetching more content...');
    
    try {
      const newContent = await fetchMorePages(10);
      setLastUpdate(new Date());
      console.log(`✅ Auto-update complete: ${newContent} new items. Pages loaded: ${loadedPages.current.movies}`);
    } catch (err) {
      console.error('Auto-update error:', err);
    } finally {
      setIsAutoUpdating(false);
    }
  }, [fetchMorePages, isAutoUpdating]);

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
      
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    
    // Auto-update every hour
    autoUpdateInterval.current = setInterval(performAutoUpdate, 60 * 60 * 1000);
    
    // Also update every 10 minutes until we have enough content
    const continuousUpdate = setInterval(() => {
      if (loadedPages.current.movies < 50) {
        performAutoUpdate();
      }
    }, 10 * 60 * 1000);
    
    return () => {
      if (autoUpdateInterval.current) clearInterval(autoUpdateInterval.current);
      clearInterval(continuousUpdate);
    };
  }, [loadInitialData, performAutoUpdate]);

  return {
    movies,
    series,
    animes,
    docs,
    isLoading,
    error,
    refetch: loadInitialData,
    searchTMDB,
    lastUpdate,
    isAutoUpdating,
    pagesLoaded: loadedPages.current.movies,
  };
}