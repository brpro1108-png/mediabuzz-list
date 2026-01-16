import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'globalupload-uploaded-media';

export const useUploadedMedia = () => {
  const { user } = useAuth();
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from database FIRST when user is logged in
  useEffect(() => {
    if (!user) {
      setIsInitialLoadDone(true);
      return;
    }

    const loadFromDatabase = async () => {
      try {
        const { data, error } = await supabase
          .from('uploaded_media')
          .select('media_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading uploads from database:', error);
          // Fallback to localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setUploadedIds(new Set(parsed));
              previousIdsRef.current = new Set(parsed);
            } catch (e) {
              console.error('Failed to parse localStorage', e);
            }
          }
        } else if (data) {
          const dbIds = new Set(data.map(item => item.media_id));
          setUploadedIds(dbIds);
          previousIdsRef.current = new Set(dbIds);
          // Update localStorage to match database
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...dbIds]));
        }
      } catch (e) {
        console.error('Failed to load from database:', e);
      } finally {
        setIsInitialLoadDone(true);
      }
    };

    loadFromDatabase();
  }, [user]);

  // Immediate sync to database when uploadedIds changes
  useEffect(() => {
    // Clear any pending sync on cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !isInitialLoadDone) return;
    
    // Check if there's actually a change
    const currentIds = [...uploadedIds];
    const previousIds = [...previousIdsRef.current];
    
    const hasChange = currentIds.length !== previousIds.length || 
        !currentIds.every(id => previousIdsRef.current.has(id));
    
    if (!hasChange) return;

    // Update localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds));

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Sync to database with minimal delay (debounce 100ms)
    const userId = user.id;
    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const toInsert = currentIds.filter(id => !previousIdsRef.current.has(id));
        const toDelete = previousIds.filter(id => !uploadedIds.has(id));

        // Insert new entries
        if (toInsert.length > 0) {
          const insertData = toInsert.map(media_id => ({
            user_id: userId,
            media_id,
          }));
          
          const { error: insertError } = await supabase
            .from('uploaded_media')
            .insert(insertData);

          if (insertError) {
            console.error('Insert error:', insertError);
          }
        }

        // Delete removed entries
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('uploaded_media')
            .delete()
            .eq('user_id', userId)
            .in('media_id', toDelete);

          if (deleteError) {
            console.error('Delete error:', deleteError);
          }
        }

        // Update reference after successful sync
        previousIdsRef.current = new Set(currentIds);
        setLastSaved(new Date());
      } catch (e) {
        console.error('Auto-sync error:', e);
      } finally {
        setIsSyncing(false);
      }
    }, 100);
  }, [user, uploadedIds, isInitialLoadDone]);

  const toggleUploaded = useCallback((id: string) => {
    setUploadedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const isUploaded = useCallback((id: string) => uploadedIds.has(id), [uploadedIds]);

  const uploadedCount = uploadedIds.size;

  // Manual sync (force full sync)
  const syncToDatabase = useCallback(async () => {
    if (!user) {
      console.error('Must be logged in to sync');
      return false;
    }

    setIsSyncing(true);
    try {
      // Get current database entries
      const { data: existingData, error: fetchError } = await supabase
        .from('uploaded_media')
        .select('media_id')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const existingIds = new Set(existingData?.map(item => item.media_id) || []);
      const currentIds = [...uploadedIds];

      // Find new IDs to insert
      const toInsert = currentIds.filter(id => !existingIds.has(id));
      // Find IDs to delete
      const toDelete = [...existingIds].filter(id => !uploadedIds.has(id));

      // Insert new entries in batches
      if (toInsert.length > 0) {
        const insertData = toInsert.map(media_id => ({
          user_id: user.id,
          media_id,
        }));

        for (let i = 0; i < insertData.length; i += 100) {
          const batch = insertData.slice(i, i + 100);
          const { error: insertError } = await supabase
            .from('uploaded_media')
            .insert(batch);

          if (insertError) {
            console.error('Insert error:', insertError);
          }
        }
      }

      // Delete removed entries
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('uploaded_media')
          .delete()
          .eq('user_id', user.id)
          .in('media_id', toDelete);

        if (deleteError) {
          console.error('Delete error:', deleteError);
        }
      }

      previousIdsRef.current = new Set(currentIds);
      setLastSaved(new Date());
      return true;
    } catch (e) {
      console.error('Sync error:', e);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, uploadedIds]);

  return { 
    uploadedIds, 
    toggleUploaded, 
    isUploaded, 
    uploadedCount,
    syncToDatabase,
    isSyncing,
    lastSaved,
    isLoggedIn: !!user,
    isInitialLoadDone,
  };
};