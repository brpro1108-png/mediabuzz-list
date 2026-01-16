import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from '@/types/media';
import { getMovies, getSeriesContent } from '@/data/mockMedia';

export function useDarkiWorldMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [seriesContent, setSeriesContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState({ movies: 1, series: 1, animes: 1, docs: 1 });

  const fetchData = useCallback(async (loadMore = false) => {
    if (!loadMore) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-api`;
      
      const pages = loadMore ? {
        movies: currentPage.movies + 1,
        series: currentPage.series + 1,
        animes: currentPage.animes + 1,
        docs: currentPage.docs + 1,
      } : { movies: 1, series: 1, animes: 1, docs: 1 };

      const [moviesRes, seriesRes, animesRes, docsRes] = await Promise.all([
        fetch(`${baseUrl}?category=movies&page=${pages.movies}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
        fetch(`${baseUrl}?category=series&page=${pages.series}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
        fetch(`${baseUrl}?category=animes&page=${pages.animes}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
        fetch(`${baseUrl}?category=docs&page=${pages.docs}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
      ]);

      const [moviesData, seriesData, animesData, docsData] = await Promise.all([
        moviesRes.json(),
        seriesRes.json(),
        animesRes.json(),
        docsRes.json(),
      ]);

      // Check if we got real data
      if (moviesData.success && moviesData.data.length > 0) {
        if (loadMore) {
          setMovies(prev => [...prev, ...moviesData.data]);
        } else {
          setMovies(moviesData.data);
        }
      } else if (!loadMore) {
        // Fallback to mock data
        console.log('Using mock data for movies');
        setMovies(getMovies());
      }

      // Combine series, animes, and docs
      const combinedSeries: MediaItem[] = [];
      
      if (seriesData.success && seriesData.data.length > 0) {
        combinedSeries.push(...seriesData.data);
      }
      if (animesData.success && animesData.data.length > 0) {
        combinedSeries.push(...animesData.data);
      }
      if (docsData.success && docsData.data.length > 0) {
        combinedSeries.push(...docsData.data);
      }

      if (combinedSeries.length > 0) {
        if (loadMore) {
          setSeriesContent(prev => [...prev, ...combinedSeries]);
        } else {
          setSeriesContent(combinedSeries);
        }
      } else if (!loadMore) {
        // Fallback to mock data
        console.log('Using mock data for series');
        setSeriesContent(getSeriesContent());
      }

      if (loadMore) {
        setCurrentPage(pages);
      } else {
        setCurrentPage({ movies: 1, series: 1, animes: 1, docs: 1 });
      }

    } catch (err) {
      console.error('Error fetching TMDB data:', err);
      setError('Erreur lors du chargement des données. Utilisation des données de démonstration.');
      // Use mock data as fallback
      if (!movies.length) setMovies(getMovies());
      if (!seriesContent.length) setSeriesContent(getSeriesContent());
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, movies.length, seriesContent.length]);

  useEffect(() => {
    fetchData();
  }, []);

  const loadMore = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    movies,
    seriesContent,
    isLoading,
    error,
    refetch: () => fetchData(false),
    loadMore,
  };
}
