import { RefreshCw, Film } from 'lucide-react';
import { SearchDropdown } from './SearchDropdown';
import { MediaItem, Category } from '@/types/media';

interface AppHeaderProps {
  onSearch: (query: string, category: 'movies' | 'series') => Promise<MediaItem[]>;
  onSelectSearchItem: (item: MediaItem) => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalMedia: number;
  uploadedCount: number;
  isUploaded: (id: string) => boolean;
  activeCategory: Category;
}

export const AppHeader = ({ 
  onSearch,
  onSelectSearchItem,
  onRefresh, 
  isLoading,
  totalMedia,
  uploadedCount,
  isUploaded,
  activeCategory,
}: AppHeaderProps) => {
  const progress = totalMedia > 0 ? (uploadedCount / totalMedia) * 100 : 0;

  return (
    <header className="app-header">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Film className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">DarkiWorld</h1>
          <p className="text-xs text-muted-foreground">Media Manager</p>
        </div>
      </div>

      {/* Search dropdown with real-time TMDB search */}
      <SearchDropdown
        onSearch={onSearch}
        onSelectItem={onSelectSearchItem}
        isUploaded={isUploaded}
        activeCategory={activeCategory}
      />

      {/* Progress + Actions */}
      <div className="flex items-center gap-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {uploadedCount.toLocaleString()} / {totalMedia.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {progress.toFixed(1)}% uploadé
            </p>
          </div>
          <div className="w-32">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 bg-secondary hover:bg-accent rounded-xl transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
