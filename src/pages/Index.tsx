import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { YTHeader } from '@/components/YTHeader';
import { YTSidebar } from '@/components/YTSidebar';
import { YTChips } from '@/components/YTChips';
import { YTGrid } from '@/components/YTGrid';
import { useUploadedMedia } from '@/hooks/useUploadedMedia';
import { useDarkiWorldMedia } from '@/hooks/useDarkiWorldMedia';
import { Category } from '@/types/media';
import { Loader2, RefreshCw } from 'lucide-react';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('films');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { toggleUploaded, isUploaded, uploadedIds } = useUploadedMedia();
  const { movies, seriesContent, isLoading, isLoadingMore, error, refetch, loadMore, hasMore } = useDarkiWorldMedia();

  const currentItems = activeCategory === 'films' ? movies : seriesContent;

  const filteredItems = useMemo(() => {
    let result = [...currentItems];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.year.includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Type filter (for series category)
    if (activeCategory === 'series' && activeTypeFilter) {
      result = result.filter((item) => item.type === activeTypeFilter);
    }

    return result;
  }, [currentItems, searchQuery, activeTypeFilter, activeCategory]);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '400px',
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [handleObserver]);

  const uploadedInCurrentCategory = useMemo(() => {
    return currentItems.filter((item) => uploadedIds.has(item.id)).length;
  }, [currentItems, uploadedIds]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <YTHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Sidebar */}
      <YTSidebar
        isOpen={sidebarOpen}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        uploadedCount={uploadedInCurrentCategory}
        totalCount={currentItems.length}
      />

      {/* Main content */}
      <main className={`yt-main ${!sidebarOpen ? 'yt-main-mini' : ''} transition-all duration-200`}>
        <div className="p-6">
          {/* Chips filter bar */}
          <div className="flex items-center gap-4 mb-6">
            <YTChips
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              activeTypeFilter={activeTypeFilter}
              onTypeFilterChange={setActiveTypeFilter}
            />
            
            {/* Refresh button */}
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-2 bg-secondary hover:bg-accent rounded-full transition-colors flex-shrink-0"
              title="Actualiser"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
            <span>{filteredItems.length} médias</span>
            <span className="text-uploaded">{uploadedInCurrentCategory} uploadés</span>
            <span>{currentItems.length - uploadedInCurrentCategory} restants</span>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Chargement des médias TMDB...</p>
            </div>
          ) : (
            <>
              <YTGrid 
                items={filteredItems} 
                isUploaded={isUploaded} 
                onToggleUpload={toggleUploaded} 
              />
              
              {/* Load more trigger */}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Chargement de plus de médias...</span>
                  </div>
                )}
                {!hasMore && filteredItems.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Fin du catalogue • {filteredItems.length} médias affichés
                  </p>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="text-center py-4 text-muted-foreground text-sm">{error}</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
