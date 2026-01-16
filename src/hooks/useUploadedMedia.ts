import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'globalupload-uploaded-media';

export const useUploadedMedia = () => {
  const { user } = useAuth();
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from localStorage immediately
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUploadedIds(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse uploaded media from localStorage', e);
      }
    }
  }, []);

  // Load from database when user logs in
  useEffect(() => {
    if (!user) return;

    const loadFromDatabase = async () => {
      try {
        const { data, error } = await supabase
          .from('uploaded_media')
          .select('media_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading uploads from database:', error);
          return;
        }

        if (data && data.length > 0) {
          const dbIds = new Set(data.map(item => item.media_id));
          // Merge with localStorage
          setUploadedIds(prev => {
            const merged = new Set([...prev, ...dbIds]);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
            return merged;
          });
        }
      } catch (e) {
        console.error('Failed to load from database:', e);
      }
    };

    loadFromDatabase();
  }, [user]);

  // Save to localStorage on change
  useEffect(() => {
    if (uploadedIds.size > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...uploadedIds]));
    }
  }, [uploadedIds]);

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

  // Sync to database
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

        // Insert in batches of 100
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

      setLastSaved(new Date());
      return true;
    } catch (e) {
      console.error('Sync error:', e);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, uploadedIds]);

  // Auto-sync every 2 minutes if user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (uploadedIds.size > 0) {
        syncToDatabase();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, uploadedIds, syncToDatabase]);

  return { 
    uploadedIds, 
    toggleUploaded, 
    isUploaded, 
    uploadedCount,
    syncToDatabase,
    isSyncing,
    lastSaved,
    isLoggedIn: !!user,
  };
};