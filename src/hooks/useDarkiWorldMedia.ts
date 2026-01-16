import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem } from '@/types/media';

const MAX_PAGES = 50; // Load up to 50 pages per category (1000 items per category)

export function useDarkiWorldMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [seriesContent, setSeriesContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPageRef = useRef({ movies: 0, series: 0, animes: 0, docs: 0 });
  const hasMoreRef = useRef({ movies: true, series: true, animes: true, docs: true });

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

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load first 5 pages of each category in parallel
      const initialPages = 5;
      
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

      const allMovies = movieResults.flat();
      const allSeries = [...seriesResults.flat(), ...animesResults.flat(), ...docsResults.flat()];

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
      const nextPages = {
        movies: currentPageRef.current.movies + 1,
        series: currentPageRef.current.series + 1,
        animes: currentPageRef.current.animes + 1,
        docs: currentPageRef.current.docs + 1,
      };

      const [newMovies, newSeries, newAnimes, newDocs] = await Promise.all([
        hasMoreRef.current.movies ? fetchPage('movies', nextPages.movies) : Promise.resolve([]),
        hasMoreRef.current.series ? fetchPage('series', nextPages.series) : Promise.resolve([]),
        hasMoreRef.current.animes ? fetchPage('animes', nextPages.animes) : Promise.resolve([]),
        hasMoreRef.current.docs ? fetchPage('docs', nextPages.docs) : Promise.resolve([]),
      ]);

      if (newMovies.length > 0) {
        setMovies(prev => [...prev, ...newMovies]);
      } else {
        hasMoreRef.current.movies = false;
      }

      const combinedNewSeries = [...newSeries, ...newAnimes, ...newDocs];
      if (combinedNewSeries.length > 0) {
        setSeriesContent(prev => [...prev, ...combinedNewSeries]);
      }
      
      if (newSeries.length === 0) hasMoreRef.current.series = false;
      if (newAnimes.length === 0) hasMoreRef.current.animes = false;
      if (newDocs.length === 0) hasMoreRef.current.docs = false;

      currentPageRef.current = nextPages;

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
