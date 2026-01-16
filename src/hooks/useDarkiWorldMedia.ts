import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MediaItem } from '@/types/media';
import { getMovies, getSeriesContent } from '@/data/mockMedia';

export function useDarkiWorldMedia() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [seriesContent, setSeriesContent] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch movies
      const moviesResponse = await supabase.functions.invoke('darkiworld-api', {
        body: null,
        method: 'GET',
      });

      // For now, try a simple GET with query params via URL
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/darkiworld-api`;
      
      const [moviesRes, seriesRes, animesRes, docsRes] = await Promise.all([
        fetch(`${baseUrl}?category=movies`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
        fetch(`${baseUrl}?category=series`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
        fetch(`${baseUrl}?category=animes`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }),
        fetch(`${baseUrl}?category=docs`, {
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
        setMovies(moviesData.data);
      } else {
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
        setSeriesContent(combinedSeries);
      } else {
        // Fallback to mock data
        console.log('Using mock data for series');
        setSeriesContent(getSeriesContent());
      }

    } catch (err) {
      console.error('Error fetching DarkiWorld data:', err);
      setError('Erreur lors du chargement des données. Utilisation des données de démonstration.');
      // Use mock data as fallback
      setMovies(getMovies());
      setSeriesContent(getSeriesContent());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    movies,
    seriesContent,
    isLoading,
    error,
    refetch: fetchData,
  };
}
