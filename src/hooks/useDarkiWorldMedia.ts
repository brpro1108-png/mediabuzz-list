import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem } from '@/types/media';

const MAX_PAGES = 100; // Load more pages for more content

export function useDarkiWorldMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [seriesContent, setSeriesContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPageRef = useRef({ movies: 0, series: 0, animes: 0, docs: 0 });
  const hasMoreRef = useRef({ movies: true, series: true, animes: true, docs: true });
  const seenIdsRef = useRef({ movies: new Set<string>(), series: new Set<string>() });

  const fetchPage = async (category: string, page: number): Promise<MediaItem[]> => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-api`;
    
    try {
      const res = await fetch(`${baseUrl}?category=${category}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      
      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        return data.data;
      }
      return [];
    } catch (err) {
      console.error(`Error fetching ${category} page ${page}:`, err);
      return [];
    }
  };

  const deduplicateItems = (items: MediaItem[], seenSet: Set<string>): MediaItem[] => {
    const result: MediaItem[] = [];
    for (const item of items) {
      if (!seenSet.has(item.id)) {
        seenSet.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    seenIdsRef.current = { movies: new Set(), series: new Set() };

    try {
      // Load first 10 pages of each category in parallel for more content
      const initialPages = 10;
      
      const moviePromises = Array.from({ length: initialPages }, (_, i) => fetchPage('movies', i + 1));
      const seriesPromises = Array.from({ length: initialPages }, (_, i) => fetchPage('series', i + 1));
      const animesPromises = Array.from({ length: initialPages }, (_, i) => fetchPage('animes', i + 1));
      const docsPromises = Array.from({ length: initialPages }, (_, i) => fetchPage('docs', i + 1));

      const [movieResults, seriesResults, animesResults, docsResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(seriesPromises),
        Promise.all(animesPromises),
        Promise.all(docsPromises),
      ]);

      // Flatten and deduplicate
      const allMoviesRaw = movieResults.flat();
      const allSeriesRaw = [...seriesResults.flat(), ...animesResults.flat(), ...docsResults.flat()];

      const allMovies = deduplicateItems(allMoviesRaw, seenIdsRef.current.movies);
      const allSeries = deduplicateItems(allSeriesRaw, seenIdsRef.current.series);

      setMovies(allMovies);
      setSeriesContent(allSeries);
      
      currentPageRef.current = { movies: initialPages, series: initialPages, animes: initialPages, docs: initialPages };
      
      // Check if there's more data
      hasMoreRef.current = {
        movies: movieResults[initialPages - 1]?.length > 0,
        series: seriesResults[initialPages - 1]?.length > 0,
        animes: animesResults[initialPages - 1]?.length > 0,
        docs: docsResults[initialPages - 1]?.length > 0,
      };

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Erreur lors du chargement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    
    const hasAnyMore = Object.values(hasMoreRef.current).some(Boolean);
    if (!hasAnyMore || currentPageRef.current.movies >= MAX_PAGES) return;

    setIsLoadingMore(true);

    try {
      // Load 5 more pages at once
      const pagesToLoad = 5;
      const basePages = currentPageRef.current;

      const moviePromises = hasMoreRef.current.movies 
        ? Array.from({ length: pagesToLoad }, (_, i) => fetchPage('movies', basePages.movies + i + 1))
        : [];
      const seriesPromises = hasMoreRef.current.series 
        ? Array.from({ length: pagesToLoad }, (_, i) => fetchPage('series', basePages.series + i + 1))
        : [];
      const animesPromises = hasMoreRef.current.animes 
        ? Array.from({ length: pagesToLoad }, (_, i) => fetchPage('animes', basePages.animes + i + 1))
        : [];
      const docsPromises = hasMoreRef.current.docs 
        ? Array.from({ length: pagesToLoad }, (_, i) => fetchPage('docs', basePages.docs + i + 1))
        : [];

      const [movieResults, seriesResults, animesResults, docsResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(seriesPromises),
        Promise.all(animesPromises),
        Promise.all(docsPromises),
      ]);

      const newMoviesRaw = movieResults.flat();
      const newSeriesRaw = [...seriesResults.flat(), ...animesResults.flat(), ...docsResults.flat()];

      const newMovies = deduplicateItems(newMoviesRaw, seenIdsRef.current.movies);
      const newSeries = deduplicateItems(newSeriesRaw, seenIdsRef.current.series);

      if (newMovies.length > 0) {
        setMovies(prev => [...prev, ...newMovies]);
      }
      if (movieResults.length > 0 && movieResults[pagesToLoad - 1]?.length === 0) {
        hasMoreRef.current.movies = false;
      }

      if (newSeries.length > 0) {
        setSeriesContent(prev => [...prev, ...newSeries]);
      }
      
      if (seriesResults.length > 0 && seriesResults[pagesToLoad - 1]?.length === 0) hasMoreRef.current.series = false;
      if (animesResults.length > 0 && animesResults[pagesToLoad - 1]?.length === 0) hasMoreRef.current.animes = false;
      if (docsResults.length > 0 && docsResults[pagesToLoad - 1]?.length === 0) hasMoreRef.current.docs = false;

      currentPageRef.current = {
        movies: basePages.movies + pagesToLoad,
        series: basePages.series + pagesToLoad,
        animes: basePages.animes + pagesToLoad,
        docs: basePages.docs + pagesToLoad,
      };

    } catch (err) {
      console.error('Error loading more data:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    movies,
    seriesContent,
    isLoading,
    isLoadingMore,
    error,
    refetch: loadInitialData,
    loadMore,
    hasMore: Object.values(hasMoreRef.current).some(Boolean),
  };
}
