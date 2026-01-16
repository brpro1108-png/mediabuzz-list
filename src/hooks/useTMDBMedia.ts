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
  
  const currentPage = useRef(1);
  const seenIds = useRef(new Set<string>());
  const autoUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPage = useCallback(async (category: string, page: number): Promise<MediaItem[]> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tmdb-api?category=${category}&page=${page}`
      );
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

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    seenIds.current.clear();
    currentPage.current = 1;

    try {
      // Load more initial pages for better coverage
      const initialPages = 20;
      const moviePromises = Array.from({ length: initialPages }, (_, i) => fetchPage('movies', i + 1));
      const seriesPromises = Array.from({ length: initialPages }, (_, i) => fetchPage('series', i + 1));
      const animePromises = Array.from({ length: initialPages }, (_, i) => fetchPage('animes', i + 1));
      const docPromises = Array.from({ length: initialPages }, (_, i) => fetchPage('docs', i + 1));

      const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(seriesPromises),
        Promise.all(animePromises),
        Promise.all(docPromises),
      ]);

      setMovies(movieResults.flat());
      setSeries(seriesResults.flat());
      setAnimes(animeResults.flat());
      setDocs(docResults.flat());
      currentPage.current = initialPages;
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
      const pagesToLoad = 5;
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
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tmdb-api?category=${category}&search=${encodeURIComponent(query)}&page=1`
      );
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

  // Auto-update every hour
  const autoUpdate = useCallback(async () => {
    console.log('Auto-updating content...');
    const newPage = currentPage.current + 1;
    
    try {
      const [movieResults, seriesResults, animeResults, docResults] = await Promise.all([
        fetchPage('movies', newPage),
        fetchPage('series', newPage),
        fetchPage('animes', newPage),
        fetchPage('docs', newPage),
      ]);

      if (movieResults.length > 0) setMovies(prev => [...prev, ...movieResults]);
      if (seriesResults.length > 0) setSeries(prev => [...prev, ...seriesResults]);
      if (animeResults.length > 0) setAnimes(prev => [...prev, ...animeResults]);
      if (docResults.length > 0) setDocs(prev => [...prev, ...docResults]);
      
      currentPage.current = newPage;
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Auto-update error:', err);
    }
  }, [fetchPage]);

  useEffect(() => {
    loadInitialData();
    autoUpdateInterval.current = setInterval(autoUpdate, 60 * 60 * 1000);
    return () => {
      if (autoUpdateInterval.current) clearInterval(autoUpdateInterval.current);
    };
  }, [loadInitialData, autoUpdate]);

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
  };
}
