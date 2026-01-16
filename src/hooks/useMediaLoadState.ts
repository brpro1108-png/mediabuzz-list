import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const LOCAL_STORAGE_KEY = 'tmdb-load-state';

interface LoadState {
  movies_pages: number;
  series_pages: number;
  animes_pages: number;
  docs_pages: number;
}

const DEFAULT_STATE: LoadState = {
  movies_pages: 0,
  series_pages: 0,
  animes_pages: 0,
  docs_pages: 0,
};

export const useMediaLoadState = () => {
  const { user } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>(DEFAULT_STATE);
  const [isReady, setIsReady] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<LoadState>(DEFAULT_STATE);

  // Load state from database or localStorage on mount
  useEffect(() => {
    const loadStateFromStorage = async () => {
      // First, try localStorage for immediate data
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as LoadState;
          setLoadState(parsed);
          lastSavedRef.current = parsed;
        } catch (e) {
          console.error('Failed to parse local load state:', e);
        }
      }

      // If user is logged in, load from database (takes priority)
      if (user) {
        try {
          const { data, error } = await supabase
            .from('media_load_state')
            .select('movies_pages, series_pages, animes_pages, docs_pages')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error loading state from database:', error);
          } else if (data) {
            const dbState: LoadState = {
              movies_pages: data.movies_pages,
              series_pages: data.series_pages,
              animes_pages: data.animes_pages,
              docs_pages: data.docs_pages,
            };
            setLoadState(dbState);
            lastSavedRef.current = dbState;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbState));
          }
        } catch (e) {
          console.error('Failed to load from database:', e);
        }
      }

      setIsReady(true);
    };

    loadStateFromStorage();
  }, [user]);

  // Save state to database and localStorage
  const saveState = useCallback(async (newState: LoadState) => {
    // Always save to localStorage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));

    if (!user) return;

    // Debounce database saves (every 2 seconds max)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('media_load_state')
          .upsert({
            user_id: user.id,
            movies_pages: newState.movies_pages,
            series_pages: newState.series_pages,
            animes_pages: newState.animes_pages,
            docs_pages: newState.docs_pages,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Error saving load state:', error);
        } else {
          lastSavedRef.current = newState;
        }
      } catch (e) {
        console.error('Failed to save to database:', e);
      }
    }, 2000);
  }, [user]);

  // Update pages loaded
  const updatePages = useCallback((category: 'movies' | 'series' | 'animes' | 'docs', pages: number) => {
    setLoadState(prev => {
      const key = `${category}_pages` as keyof LoadState;
      if (prev[key] >= pages) return prev; // Don't go backwards
      
      const newState = { ...prev, [key]: pages };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    loadState,
    updatePages,
    isReady,
    getStartPage: (category: 'movies' | 'series' | 'animes' | 'docs') => {
      const key = `${category}_pages` as keyof LoadState;
      return loadState[key] || 0;
    },
  };
};
