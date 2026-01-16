import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MediaGrid } from '@/components/MediaGrid';
import { StatsBar } from '@/components/StatsBar';
import { useUploadedMedia } from '@/hooks/useUploadedMedia';
import { getMovies, getSeriesContent } from '@/data/mockMedia';
import { Category } from '@/types/media';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('films');
  const [searchQuery, setSearchQuery] = useState('');
  const { toggleUploaded, isUploaded, uploadedIds } = useUploadedMedia();

  const movies = useMemo(() => getMovies(), []);
  const seriesContent = useMemo(() => getSeriesContent(), []);

  const currentItems = activeCategory === 'films' ? movies : seriesContent;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    const query = searchQuery.toLowerCase();
    return currentItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.year.includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }, [currentItems, searchQuery]);

  const uploadedInCurrentCategory = useMemo(() => {
    return currentItems.filter((item) => uploadedIds.has(item.id)).length;
  }, [currentItems, uploadedIds]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            filmCount={movies.length}
            seriesCount={seriesContent.length}
          />
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un titre..."
          />
        </div>

        {/* Stats */}
        <StatsBar
          totalCount={filteredItems.length}
          uploadedCount={uploadedInCurrentCategory}
        />

        {/* Media Grid */}
        <MediaGrid
          items={filteredItems}
          isUploaded={isUploaded}
          onToggleUpload={toggleUploaded}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            DarkiWorld Tracker • Les données sont sauvegardées localement
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
