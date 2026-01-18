import { useState, useEffect, useCallback } from 'react';
import { MediaItem, Category, SMART_COLLECTIONS } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDBMedia() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [animes, setAnimes] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load media from database
  const loadMedia = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all media items from database
      const { data, error: dbError } = await supabase
        .from('media_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      if (data) {
        const movieItems: MediaItem[] = [];
        const seriesItems: MediaItem[] = [];
        const animeItems: MediaItem[] = [];
        const docItems: MediaItem[] = [];

        data.forEach((item) => {
          const mediaItem: MediaItem = {
            id: `${item.tmdb_id}-${item.media_type}`,
            title: item.title,
            year: item.release_date ? new Date(item.release_date).getFullYear().toString() : '',
            type: item.media_type as 'movie' | 'series' | 'anime' | 'documentary',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder.svg',
            description: item.overview || '',
            popularity: item.vote_average || 0,
            releaseDate: item.release_date || '',
            genres: [] as number[],
            genreNames: item.genres || [],
            collectionId: item.collection_id ? undefined : undefined, // collection_id is uuid string, collectionId should be number
          };

          switch (item.media_type) {
            case 'movie':
              movieItems.push(mediaItem);
              break;
            case 'series':
              seriesItems.push(mediaItem);
              break;
            case 'anime':
              animeItems.push(mediaItem);
              break;
            case 'documentary':
              docItems.push(mediaItem);
              break;
          }
        });

        setMovies(movieItems);
        setSeries(seriesItems);
        setAnimes(animeItems);
        setDocs(docItems);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error loading media:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Search TMDB
  const searchTMDB = useCallback(async (query: string, category: 'movies' | 'series'): Promise<MediaItem[]> => {
    if (!query.trim()) return [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = category === 'movies' ? 'movie' : 'tv';
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-api?search=${encodeURIComponent(query)}&type=${endpoint}`,
        {
          headers: session ? {
            'Authorization': `Bearer ${session.access_token}`,
          } : {},
        }
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

  // Delete all non-uploaded media (Emergency button)
  const deleteNonUploadedMedia = useCallback(async (): Promise<{ deleted: number; error: string | null }> => {
    if (!user) {
      return { deleted: 0, error: 'Non connecté' };
    }

    try {
      // Get all uploaded media IDs
      const { data: uploadedData, error: uploadedError } = await supabase
        .from('uploaded_media')
        .select('media_id')
        .eq('user_id', user.id);

      if (uploadedError) throw uploadedError;

      const uploadedIds = new Set(uploadedData?.map(u => u.media_id) || []);

      // Get all media items
      const { data: allMedia, error: mediaError } = await supabase
        .from('media_items')
        .select('id, tmdb_id, media_type')
        .eq('user_id', user.id);

      if (mediaError) throw mediaError;

      // Find items to delete (not in uploaded)
      const itemsToDelete = (allMedia || []).filter(item => {
        const mediaId = `${item.tmdb_id}-${item.media_type}`;
        return !uploadedIds.has(mediaId);
      });

      if (itemsToDelete.length === 0) {
        return { deleted: 0, error: null };
      }

      // Delete non-uploaded items
      const idsToDelete = itemsToDelete.map(i => i.id);
      const { error: deleteError } = await supabase
        .from('media_items')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      // Reload media
      await loadMedia();

      return { deleted: itemsToDelete.length, error: null };
    } catch (err) {
      console.error('Delete error:', err);
      return { deleted: 0, error: err instanceof Error ? err.message : 'Erreur de suppression' };
    }
  }, [user, loadMedia]);

  // Load on mount and when user changes
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Get import state
  const [importState, setImportState] = useState<{
    moviesImported: number;
    seriesImported: number;
    isImporting: boolean;
  }>({ moviesImported: 0, seriesImported: 0, isImporting: false });

  useEffect(() => {
    const loadImportState = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('import_state')
        .select('movies_imported, series_imported, is_importing')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setImportState({
          moviesImported: data.movies_imported || 0,
          seriesImported: data.series_imported || 0,
          isImporting: data.is_importing || false,
        });
      }
    };

    loadImportState();
    
    // Subscribe to import state changes
    const channel = supabase
      .channel('import_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'import_state',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as Record<string, unknown>;
            setImportState({
              moviesImported: (newData.movies_imported as number) || 0,
              seriesImported: (newData.series_imported as number) || 0,
              isImporting: (newData.is_importing as boolean) || false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    movies,
    series,
    animes,
    docs,
    smartCollections: {} as Record<string, MediaItem[]>,
    seriesCollections: {} as Record<string, MediaItem[]>,
    isLoading,
    error,
    refetch: loadMedia,
    searchTMDB,
    lastUpdate,
    isAutoUpdating: importState.isImporting,
    pagesLoaded: importState.moviesImported + importState.seriesImported,
    deleteNonUploadedMedia,
  };
}
