import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar, UploadFilter, SortMode } from '@/components/AppSidebar';
import { MediaList } from '@/components/MediaList';
import { useUploadedMedia } from '@/hooks/useUploadedMedia';
import { useTMDBMedia } from '@/hooks/useTMDBMedia';
import { Category } from '@/types/media';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('films');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFilter, setUploadFilter] = useState<UploadFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { toggleUploaded, isUploaded, uploadedIds } = useUploadedMedia();
  const { 
    movies, 
    series, 
    animes, 
    docs, 
    isLoading, 
    isLoadingMore, 
    error, 
    refetch, 
    loadMore, 
    hasMore,
    lastUpdate
  } = useTMDBMedia();

  // Determine current items based on category and type filter
  const currentItems = useMemo(() => {
    if (activeTypeFilter === 'anime') return animes;
    if (activeTypeFilter === 'documentary') return docs;
    return activeCategory === 'films' ? movies : series;
  }, [activeCategory, activeTypeFilter, movies, series, animes, docs]);

  // Calculate stats
  const stats = useMemo(() => ({
    totalFilms: movies.length,
    totalSeries: series.length,
    uploadedFilms: movies.filter(m => uploadedIds.has(m.id)).length,
    uploadedSeries: series.filter(s => uploadedIds.has(s.id)).length,
  }), [movies, series, uploadedIds]);

  const totalMedia = movies.length + series.length + animes.length + docs.length;
  const totalUploaded = stats.uploadedFilms + stats.uploadedSeries + 
    animes.filter(a => uploadedIds.has(a.id)).length + 
    docs.filter(d => uploadedIds.has(d.id)).length;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...currentItems];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.year.includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.genreNames?.some(g => g.toLowerCase().includes(query))
      );
    }

    // Upload filter
    if (uploadFilter === 'uploaded') {
      result = result.filter((item) => uploadedIds.has(item.id));
    } else if (uploadFilter === 'not_uploaded') {
      result = result.filter((item) => !uploadedIds.has(item.id));
    }

    // Sort
    if (sortMode === 'recent') {
      result = result.sort((a, b) => {
        const dateA = a.releaseDate || a.year || '';
        const dateB = b.releaseDate || b.year || '';
        return dateB.localeCompare(dateA);
      });
    } else if (sortMode === 'popular') {
      result = result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return result;
  }, [currentItems, searchQuery, uploadFilter, sortMode, uploadedIds]);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  useEffect(() => {
    const option = { root: null, rootMargin: '400px', threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
  }, [handleObserver]);

  const getTitle = () => {
    if (activeTypeFilter === 'anime') return 'Animes';
    if (activeTypeFilter === 'documentary') return 'Documentaires';
    return activeCategory === 'films' ? 'Films' : 'Séries';
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        isLoading={isLoading}
        totalMedia={totalMedia}
        uploadedCount={totalUploaded}
      />

      <AppSidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeTypeFilter={activeTypeFilter}
        onTypeFilterChange={setActiveTypeFilter}
        uploadFilter={uploadFilter}
        onUploadFilterChange={setUploadFilter}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        stats={stats}
      />

      <main className="app-main">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
              <span className="text-sm text-muted-foreground">
                {filteredItems.length.toLocaleString()} résultats
              </span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                MAJ auto: toutes les heures • Dernière: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Chargement des médias...</p>
            </div>
          ) : (
            <>
              <MediaList items={filteredItems} isUploaded={isUploaded} onToggleUpload={toggleUploaded} />
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Chargement...</span>
                  </div>
                )}
              </div>
            </>
          )}
          {error && <div className="text-center py-4 text-destructive text-sm">{error}</div>}
        </div>
      </main>
    </div>
  );
};

export default Index;
