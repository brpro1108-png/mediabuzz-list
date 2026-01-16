import { useState, useMemo, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar, UploadFilter, SortMode } from '@/components/AppSidebar';
import { MediaList } from '@/components/MediaList';
import { useUploadedMedia } from '@/hooks/useUploadedMedia';
import { useTMDBMedia } from '@/hooks/useTMDBMedia';
import { Category, MediaItem } from '@/types/media';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 100;

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('films');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [uploadFilter, setUploadFilter] = useState<UploadFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'local' | 'tmdb'>('local');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toggleUploaded, isUploaded, uploadedIds } = useUploadedMedia();
  const { 
    movies, 
    series, 
    animes, 
    docs, 
    isLoading, 
    error, 
    refetch, 
    searchTMDB,
    lastUpdate,
    isAutoUpdating,
    pagesLoaded,
  } = useTMDBMedia();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeTypeFilter, uploadFilter, sortMode, selectedGenres, localSearchQuery]);

  // Handle search item selection
  const handleSelectSearchItem = useCallback((item: MediaItem) => {
    toggleUploaded(item.id);
    toast.success(
      isUploaded(item.id) 
        ? `${item.title} retiré des uploads` 
        : `${item.title} marqué comme uploadé`
    );
  }, [toggleUploaded, isUploaded]);

  // Handle genre toggle
  const handleGenreToggle = useCallback((genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  }, []);

  const handleClearGenres = useCallback(() => {
    setSelectedGenres([]);
  }, []);

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

    // Local search filter
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.year.includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.genreNames?.some(g => g.toLowerCase().includes(query)) ||
          item.collectionName?.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      result = result.filter(item => 
        item.genres && item.genres.some(g => selectedGenres.includes(g))
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
  }, [currentItems, localSearchQuery, selectedGenres, uploadFilter, sortMode, uploadedIds]);

  const getTitle = () => {
    if (activeTypeFilter === 'anime') return 'Animes';
    if (activeTypeFilter === 'documentary') return 'Documentaires';
    return activeCategory === 'films' ? 'Films' : 'Séries';
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onSearch={searchTMDB}
        onSelectSearchItem={handleSelectSearchItem}
        onRefresh={refetch}
        isLoading={isLoading}
        totalMedia={totalMedia}
        uploadedCount={totalUploaded}
        isUploaded={isUploaded}
        activeCategory={activeCategory}
        localSearchQuery={localSearchQuery}
        onLocalSearchChange={setLocalSearchQuery}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
        isAutoUpdating={isAutoUpdating}
        currentPage={pagesLoaded}
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
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
        onClearGenres={handleClearGenres}
      />

      <main className="app-main">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
              <span className="text-sm text-muted-foreground">
                {filteredItems.length.toLocaleString()} résultats
              </span>
              {localSearchQuery && (
                <span className="text-xs bg-accent text-foreground px-2 py-1 rounded-full">
                  Recherche: "{localSearchQuery}"
                </span>
              )}
              {selectedGenres.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  {selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  MAJ: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {isAutoUpdating && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Mise à jour...
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Chargement des médias...</p>
            </div>
          ) : (
            <MediaList 
              items={filteredItems} 
              isUploaded={isUploaded} 
              onToggleUpload={toggleUploaded}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
          {error && <div className="text-center py-4 text-destructive text-sm">{error}</div>}
        </div>
      </main>
    </div>
  );
};

export default Index;