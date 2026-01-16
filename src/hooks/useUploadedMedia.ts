import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'darkiworld-uploaded-media';

export const useUploadedMedia = () => {
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
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

  // Save to localStorage whenever uploadedIds changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...uploadedIds]));
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

  const isUploaded = useCallback((id: string) => {
    return uploadedIds.has(id);
  }, [uploadedIds]);

  return { uploadedIds, toggleUploaded, isUploaded };
};
