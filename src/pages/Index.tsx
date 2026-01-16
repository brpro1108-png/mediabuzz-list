import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MediaGrid } from '@/components/MediaGrid';
import { StatsBar } from '@/components/StatsBar';
import { FilterBar } from '@/components/FilterBar';
import { useUploadedMedia } from '@/hooks/useUploadedMedia';
import { useDarkiWorldMedia } from '@/hooks/useDarkiWorldMedia';
import { Category, FilterOptions } from '@/types/media';
import { Loader2, RefreshCw } from 'lucide-react';

const ITEMS_PER_PAGE = 30;

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('films');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    sortBy: 'popularity',
    sortDirection: 'desc',
  });
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { toggleUploaded, isUploaded, uploadedIds } = useUploadedMedia();
  const { movies, seriesContent, isLoading, error, refetch } = useDarkiWorldMedia();

  const currentItems = activeCategory === 'films' ? movies : seriesContent;

  // Reset displayed count when category or filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [activeCategory, searchQuery, filters]);

  const filteredAndSortedItems = useMemo(() => {
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
    if (activeCategory === 'series' && filters.types.length > 0) {
      result = result.filter((item) => filters.types.includes(item.type));
    }

    // Year filter
    if (filters.yearRange) {
      result = result.filter((item) => {
        const year = parseInt(item.year);
        return year >= filters.yearRange![0] && year <= filters.yearRange![1];
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'year':
          comparison = parseInt(a.year || '0') - parseInt(b.year || '0');
          break;
        case 'popularity':
          comparison = (a.popularity || 0) - (b.popularity || 0);
          break;
      }
      return filters.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [currentItems, searchQuery, filters, activeCategory]);

  // Items to display (with infinite scroll)
  const displayedItems = useMemo(() => {
    return filteredAndSortedItems.slice(0, displayedCount);
  }, [filteredAndSortedItems, displayedCount]);

  const hasMoreItems = displayedCount < filteredAndSortedItems.length;

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMoreItems) {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [hasMoreItems]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '200px',
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

  const availableYears = useMemo(() => {
    return [...new Set(currentItems.map((item) => parseInt(item.year)).filter(Boolean))].sort((a, b) => b - a);
  }, [currentItems]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Floating particles background */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              filmCount={movies.length}
              seriesCount={seriesContent.length}
            />
            {/* Refresh button */}
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-3 rounded-xl bg-secondary border border-border hover:border-primary/40 hover:bg-primary/10 transition-all disabled:opacity-50"
              title="Mettre à jour les contenus"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher dans les archives..." />
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          availableYears={availableYears}
          activeCategory={activeCategory}
        />

        {/* Stats */}
        <StatsBar totalCount={filteredAndSortedItems.length} uploadedCount={uploadedInCurrentCategory} />

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-body italic">Consultation des archives...</p>
          </div>
        ) : (
          <>
            <MediaGrid items={displayedItems} isUploaded={isUploaded} onToggleUpload={toggleUploaded} />
            
            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {hasMoreItems && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-body italic">Chargement de plus de contenus...</span>
                </div>
              )}
            </div>
            
            {/* End of list indicator */}
            {!hasMoreItems && filteredAndSortedItems.length > ITEMS_PER_PAGE && (
              <div className="text-center py-6">
                <div className="ornament-divider mb-4">
                  <span className="ornament-symbol">✦</span>
                </div>
                <p className="text-sm text-muted-foreground font-body italic">
                  Fin des archives • {filteredAndSortedItems.length} éléments affichés
                </p>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="text-center py-4 text-muted-foreground text-sm font-body italic">{error}</div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="ornament-divider mb-4">
            <span className="ornament-symbol">✦</span>
          </div>
          <p className="text-sm text-muted-foreground font-body italic">
            DarkiWorld Tracker • Les données sont sauvegardées localement dans votre navigateur
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
