import { useState, useMemo, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar, UploadFilter, SortMode } from '@/components/AppSidebar';
import { MediaList } from '@/components/MediaList';
import { SmartCollectionBar } from '@/components/SmartCollectionBar';
import { SmartCollectionCard } from '@/components/SmartCollectionCard';
import { MediaPagination } from '@/components/MediaPagination';
import { useUploadedMedia } from '@/hooks/useUploadedMedia';
import { useTMDBMedia } from '@/hooks/useTMDBMedia';
import { Category, MediaItem, ViewFilter, SMART_COLLECTIONS } from '@/types/media';
import { Loader2, Save, CheckCircle, Cloud } from 'lucide-react';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 100;
const COLLECTIONS_PER_PAGE = 20;

// Generate all box office years
const BOX_OFFICE_YEARS = Array.from({ length: 36 }, (_, i) => 2025 - i);

// Map category to collection IDs for MOVIES
const MOVIE_CATEGORY_COLLECTIONS: Record<string, string[]> = {
  'Tendances': ['trending', 'now_playing', 'upcoming', 'top_rated'],
  'Box Office': BOX_OFFICE_YEARS.map(y => `box_office_${y}`),
  'Sagas': ['harrypotter', 'lotr', 'hobbit', 'starwars', 'bond', 'fast', 'jurassic', 'transformers', 'mission', 'pirates', 'matrix', 'avengers', 'xmen', 'batman', 'spiderman', 'iceage', 'shrek', 'toystory', 'despicableme', 'hungergames', 'twilight', 'indianajones', 'alien', 'terminator', 'rocky', 'diehard', 'bourne', 'johnwick', 'godfather', 'backtothefuture', 'madmax'],
  'Studios': ['marvel', 'dc', 'disney', 'pixar', 'ghibli', 'dreamworks', 'warner', 'universal', 'paramount', 'sony', 'lionsgate', 'fox', 'mgm'],
  'Genres': ['action', 'comedy', 'horror', 'romance', 'scifi', 'thriller', 'family', 'classics', 'war', 'musicals', 'animation', 'adventure', 'crime', 'mystery', 'western'],
  'Awards': ['oscar', 'palme', 'golden_globe', 'bafta'],
  'International': ['french', 'korean', 'kdrama', 'japanese', 'bollywood', 'spanish', 'latino', 'turkish', 'chinese', 'british', 'italian', 'german', 'arabic', 'thai', 'vietnamese'],
  'Plateformes': ['netflix', 'disneyplus', 'hbo', 'prime', 'appletv', 'hulu', 'peacock', 'paramount_plus', 'showtime', 'starz'],
  'Spécial': ['christmas', 'halloween', 'superhero', 'sports', 'biography', 'historical'],
};

// Map category to collection IDs for SERIES
const SERIES_CATEGORY_COLLECTIONS: Record<string, string[]> = {
  'Tendances Séries': ['series_trending', 'series_popular', 'series_top_rated', 'series_airing', 'series_new'],
  'K-Drama': ['kdrama_popular', 'kdrama_romance', 'kdrama_thriller', 'kdrama_historical', 'kdrama_fantasy'],
  'Plateformes': ['netflix_series', 'disney_series', 'hbo_series', 'prime_series', 'apple_series', 'paramount_series'],
  'International': ['turkish_series', 'spanish_series', 'british_series', 'french_series', 'japanese_series', 'latino_series', 'chinese_series'],
  'Genres': ['series_drama', 'series_comedy', 'series_crime', 'series_scifi', 'series_fantasy', 'series_horror', 'series_thriller', 'series_action', 'series_mystery', 'series_romance'],
  'Classiques TV': ['series_classic', 'series_sitcom', 'series_medical', 'series_legal', 'series_teen'],
  'Animations': ['anime_popular', 'anime_action', 'anime_romance', 'anime_fantasy', 'cartoon_series'],
};

// Get collection name
const getCollectionName = (id: string): string => {
  const config = SMART_COLLECTIONS[id as keyof typeof SMART_COLLECTIONS];
  if (config) return config.name;
  
  // Handle dynamic box office years
  if (id.startsWith('box_office_')) {
    const year = id.replace('box_office_', '');
    return `💰 Box Office ${year}`;
  }
  return id;
};

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('films');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [uploadFilter, setUploadFilter] = useState<UploadFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'local' | 'tmdb'>('local');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSmartCategory, setActiveSmartCategory] = useState<string | null>(null);
  const [collectionsPage, setCollectionsPage] = useState(1);
  
  const { 
    toggleUploaded, 
    isUploaded, 
    uploadedIds, 
    syncToDatabase, 
    isSyncing, 
    lastSaved,
    isLoggedIn 
  } = useUploadedMedia();
  
  const { 
    movies, 
    series, 
    animes, 
    docs,
    smartCollections,
    seriesCollections,
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
    setCollectionsPage(1);
  }, [activeCategory, activeTypeFilter, uploadFilter, sortMode, viewFilter, selectedGenres, localSearchQuery, activeSmartCategory]);

  // Reset smart category when changing main category
  useEffect(() => {
    setActiveSmartCategory(null);
  }, [activeCategory]);

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

  // Get collections for current smart category
  const currentSmartCollections = useMemo(() => {
    if (!activeSmartCategory) return [];
    
    const categoryMap = activeCategory === 'films' ? MOVIE_CATEGORY_COLLECTIONS : SERIES_CATEGORY_COLLECTIONS;
    const collectionsData = activeCategory === 'films' ? smartCollections : seriesCollections;
    const collectionIds = categoryMap[activeSmartCategory] || [];
    
    return collectionIds
      .filter(id => collectionsData[id] && collectionsData[id].length > 0)
      .map(id => ({
        id,
        name: getCollectionName(id),
        items: collectionsData[id] || [],
      }));
  }, [activeSmartCategory, activeCategory, smartCollections, seriesCollections]);

  // Paginate collections
  const totalCollectionPages = Math.ceil(currentSmartCollections.length / COLLECTIONS_PER_PAGE);
  const paginatedCollections = useMemo(() => {
    const start = (collectionsPage - 1) * COLLECTIONS_PER_PAGE;
    return currentSmartCollections.slice(start, start + COLLECTIONS_PER_PAGE);
  }, [currentSmartCollections, collectionsPage]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...currentItems];

    // View filter - only show collections
    if (viewFilter === 'collections') {
      result = result.filter(item => item.collectionId && item.collectionName);
    }

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
  }, [currentItems, viewFilter, localSearchQuery, selectedGenres, uploadFilter, sortMode, uploadedIds]);

  const getTitle = () => {
    if (activeSmartCategory) return activeSmartCategory;
    if (activeTypeFilter === 'anime') return 'Animes';
    if (activeTypeFilter === 'documentary') return 'Documentaires';
    return activeCategory === 'films' ? 'Films' : 'Séries';
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCollectionsPageChange = useCallback((page: number) => {
    setCollectionsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check if we should show smart collections bar
  const showSmartCollections = !activeTypeFilter;

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
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setActiveSmartCategory(null);
        }}
        activeTypeFilter={activeTypeFilter}
        onTypeFilterChange={setActiveTypeFilter}
        uploadFilter={uploadFilter}
        onUploadFilterChange={setUploadFilter}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        viewFilter={viewFilter}
        onViewFilterChange={setViewFilter}
        stats={stats}
        selectedGenres={selectedGenres}
        onGenreToggle={handleGenreToggle}
        onClearGenres={handleClearGenres}
      />

      <main className="app-main">
        <div className="p-6">
          {/* Smart Collection Category Tabs */}
          {showSmartCollections && (
            <SmartCollectionBar
              activeSmartCategory={activeSmartCategory}
              onSmartCategoryChange={setActiveSmartCategory}
              mediaCategory={activeCategory}
            />
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
              <span className="text-sm text-muted-foreground">
                {activeSmartCategory 
                  ? `${currentSmartCollections.length} collections`
                  : `${filteredItems.length.toLocaleString()} résultats`
                }
              </span>
              {viewFilter === 'collections' && !activeSmartCategory && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  Collections uniquement
                </span>
              )}
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
              {/* Save button */}
              <button
                onClick={async () => {
                  const success = await syncToDatabase();
                  if (success) {
                    toast.success('Données sauvegardées avec succès!');
                  } else {
                    toast.error('Erreur de sauvegarde. Réessayez.');
                  }
                }}
                disabled={isSyncing || !isLoggedIn}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isSyncing 
                    ? 'bg-primary/20 text-primary' 
                    : lastSaved 
                      ? 'bg-uploaded/20 text-uploaded hover:bg-uploaded/30' 
                      : 'bg-secondary text-foreground hover:bg-primary/20 hover:text-primary'
                } btn-glow`}
                title={isLoggedIn ? 'Sauvegarder dans le cloud' : 'Connectez-vous pour sauvegarder'}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Sauvegardé
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </>
                )}
              </button>

              {lastSaved && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                📄 {pagesLoaded} pages
              </span>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  MAJ: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
          ) : activeSmartCategory ? (
            // Show smart collections directly as cards
            <div className="space-y-4">
              {/* Pagination Top */}
              {totalCollectionPages > 1 && (
                <MediaPagination
                  currentPage={collectionsPage}
                  totalPages={totalCollectionPages}
                  onPageChange={handleCollectionsPageChange}
                  totalItems={currentSmartCollections.length}
                  itemsPerPage={COLLECTIONS_PER_PAGE}
                />
              )}

              {/* Collection Cards */}
              <div className="space-y-3">
                {paginatedCollections.map(collection => (
                  <SmartCollectionCard
                    key={collection.id}
                    id={collection.id}
                    name={collection.name}
                    items={collection.items}
                    isUploaded={isUploaded}
                    onToggleUpload={toggleUploaded}
                  />
                ))}
              </div>

              {paginatedCollections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Chargement des collections...</h3>
                  <p className="text-sm text-muted-foreground">Les données sont en cours de récupération</p>
                </div>
              )}

              {/* Pagination Bottom */}
              {totalCollectionPages > 1 && (
                <MediaPagination
                  currentPage={collectionsPage}
                  totalPages={totalCollectionPages}
                  onPageChange={handleCollectionsPageChange}
                  totalItems={currentSmartCollections.length}
                  itemsPerPage={COLLECTIONS_PER_PAGE}
                />
              )}
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