import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { MediaItem } from '@/types/media';

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

const PAGES_PER_COLLECTION = 10;

export type ImportStatus = 'paused' | 'running' | 'completed';

interface ImportState {
  status: ImportStatus;
  moviesPage: number;
  seriesPage: number;
  animesPage: number;
  docsPage: number;
  movieCollectionIndex: number;
  seriesCollectionIndex: number;
  totalImported: number;
  lastSavedAt: string | null;
}

const DEFAULT_IMPORT_STATE: ImportState = {
  status: 'paused',
  moviesPage: 0,
  seriesPage: 0,
  animesPage: 0,
  docsPage: 0,
  movieCollectionIndex: 0,
  seriesCollectionIndex: 0,
  totalImported: 0,
  lastSavedAt: null,
};

export function useTMDBImport() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [animes, setAnimes] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<MediaItem[]>([]);
  const [smartCollections, setSmartCollections] = useState<Record<string, MediaItem[]>>({});
  const [seriesCollections, setSeriesCollections] = useState<Record<string, MediaItem[]>>({});
  
  const [importState, setImportState] = useState<ImportState>(DEFAULT_IMPORT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Refs for tracking
  const seenIds = useRef(new Set<string>());
  const importIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isImportingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockIdRef = useRef<string | null>(null);
  const lastClickRef = useRef<number>(0);

  // Generate unique lock ID for this tab
  useEffect(() => {
    lockIdRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Save state to database
  const saveStateToDatabase = useCallback(async (state: ImportState) => {
    if (!user) return;
    
    try {
      // Use media_load_state table for persistence
      const { error: upsertError } = await supabase
        .from('media_load_state')
        .upsert({
          user_id: user.id,
          movies_pages: state.moviesPage,
          series_pages: state.seriesPage,
          animes_pages: state.animesPage,
          docs_pages: state.docsPage,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Failed to save import state:', upsertError);
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [user]);

  // Debounced save
  const debouncedSave = useCallback((state: ImportState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveStateToDatabase(state);
    }, 1000);
  }, [saveStateToDatabase]);

  // Load state from database on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadState = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('media_load_state')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error loading import state:', fetchError);
          setIsLoading(false);
          return;
        }

        if (data) {
          setImportState({
            status: 'paused', // Always start paused
            moviesPage: data.movies_pages || 0,
            seriesPage: data.series_pages || 0,
            animesPage: data.animes_pages || 0,
            docsPage: data.docs_pages || 0,
            movieCollectionIndex: 0,
            seriesCollectionIndex: 0,
            totalImported: 0,
            lastSavedAt: data.updated_at,
          });
        }
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to load state:', e);
        setIsLoading(false);
      }
    };

    loadState();
  }, [user]);

  // Fetch a single page
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
  const fetchSmartCollection = useCallback(async (collectionId: string): Promise<MediaItem[]> => {
    try {
      const allItems: MediaItem[] = [];
      const seenCollectionIds = new Set<string>();

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

  // Fetch series collection
  const fetchSeriesCollection = useCallback(async (collectionId: string): Promise<MediaItem[]> => {
    try {
      const allItems: MediaItem[] = [];
      const seenCollectionIds = new Set<string>();

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

  // Single import step
  const performImportStep = useCallback(async () => {
    if (importState.status !== 'running' || isImportingRef.current) return;
    
    isImportingRef.current = true;
    
    try {
      const newPage = importState.moviesPage + 1;
      
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
      
      const newState: ImportState = {
        ...importState,
        moviesPage: newPage,
        seriesPage: newPage,
        animesPage: newPage,
        docsPage: newPage,
        totalImported: importState.totalImported + 
          movieResults.length + seriesResults.length + 
          animeResults.length + docResults.length,
        lastSavedAt: new Date().toISOString(),
      };
      
      setImportState(newState);
      debouncedSave(newState);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Import step error:', err);
      // On error, pause the import
      setImportState(prev => ({ ...prev, status: 'paused' }));
      setError('Erreur réseau. Import mis en pause.');
    } finally {
      isImportingRef.current = false;
    }
  }, [importState, fetchPage, debouncedSave]);

  // Start/Stop import interval
  useEffect(() => {
    if (importState.status === 'running') {
      // Clear any existing interval
      if (importIntervalRef.current) {
        clearInterval(importIntervalRef.current);
      }
      
      // Start new interval - fetch every 1 second
      importIntervalRef.current = setInterval(() => {
        performImportStep();
      }, 1000);
      
    } else {
      // Stop interval when paused
      if (importIntervalRef.current) {
        clearInterval(importIntervalRef.current);
        importIntervalRef.current = null;
      }
    }

    return () => {
      if (importIntervalRef.current) {
        clearInterval(importIntervalRef.current);
      }
    };
  }, [importState.status, performImportStep]);

  // Toggle import (Start/Pause)
  const toggleImport = useCallback(() => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;

    setImportState(prev => {
      const newStatus: ImportStatus = prev.status === 'running' ? 'paused' : 'running';
      const newState: ImportState = { ...prev, status: newStatus };
      
      // Save state immediately on status change
      saveStateToDatabase(newState);
      
      return newState;
    });
  }, [saveStateToDatabase]);

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

  // Load initial data without auto-starting import
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    seenIds.current.clear();

    try {
      // Load pages based on saved state
      const startPage = Math.max(1, importState.moviesPage - 8);
      const endPage = Math.max(8, importState.moviesPage);
      const pagesToLoad = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
      
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
      
      // Load priority collections in background
      const priorityMovieCollections = [
        'trending', 'now_playing', 'upcoming', 'top_rated',
        'harrypotter', 'lotr', 'starwars', 'marvel', 'dc',
        'box_office_2025', 'box_office_2024', 'box_office_2023',
        'netflix', 'disney', 'pixar', 'dreamworks',
      ];
      
      for (let i = 0; i < priorityMovieCollections.length; i += 3) {
        const batch = priorityMovieCollections.slice(i, i + 3);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
      const prioritySeriesCollections = [
        'series_trending', 'series_popular', 'series_top_rated', 'series_airing',
        'kdrama_popular', 'kdrama_romance',
        'netflix_series', 'disney_series', 'hbo_series', 'prime_series',
      ];
      
      for (let i = 0; i < prioritySeriesCollections.length; i += 3) {
        const batch = prioritySeriesCollections.slice(i, i + 3);
        const results = await Promise.all(batch.map(id => fetchSeriesCollection(id)));
        setSeriesCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
      // Load remaining collections
      const remainingMovieCollections = ALL_MOVIE_COLLECTIONS.filter(id => !priorityMovieCollections.includes(id));
      for (let i = 0; i < remainingMovieCollections.length; i += 4) {
        const batch = remainingMovieCollections.slice(i, i + 4);
        const results = await Promise.all(batch.map(id => fetchSmartCollection(id)));
        setSmartCollections(prev => ({ ...prev, ...Object.fromEntries(batch.map((id, idx) => [id, results[idx]])) }));
      }
      
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
  }, [importState.moviesPage, fetchPage, fetchSmartCollection, fetchSeriesCollection]);

  // Load initial data once when state is loaded
  useEffect(() => {
    if (!isLoading && user) {
      loadInitialData();
    }
  }, [isLoading, user]); // Intentionally not including loadInitialData to avoid loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (importIntervalRef.current) {
        clearInterval(importIntervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
    importState,
    toggleImport,
    pagesLoaded: importState.moviesPage,
  };
}
