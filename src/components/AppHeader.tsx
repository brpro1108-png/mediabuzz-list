import { RefreshCw, Search, X, Filter } from 'lucide-react';
import { SearchDropdown } from './SearchDropdown';
import { MediaItem, Category } from '@/types/media';
import logo from '@/assets/logo.png';

interface AppHeaderProps {
  onSearch: (query: string, category: 'movies' | 'series') => Promise<MediaItem[]>;
  onSelectSearchItem: (item: MediaItem) => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalMedia: number;
  uploadedCount: number;
  isUploaded: (id: string) => boolean;
  activeCategory: Category;
  // Normal search mode
  localSearchQuery: string;
  onLocalSearchChange: (query: string) => void;
  searchMode: 'local' | 'tmdb';
  onSearchModeChange: (mode: 'local' | 'tmdb') => void;
  isAutoUpdating?: boolean;
  currentPage?: number;
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
  localSearchQuery,
  onLocalSearchChange,
  searchMode,
  onSearchModeChange,
  isAutoUpdating,
  currentPage,
}: AppHeaderProps) => {
  const progress = totalMedia > 0 ? (uploadedCount / totalMedia) * 100 : 0;

  return (
    <header className="app-header">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
          <img 
            src={logo} 
            alt="Global Upload" 
            className="w-full h-full object-contain logo-glow"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">GlobalUpload</h1>
          <p className="text-xs text-muted-foreground">Media Manager</p>
        </div>
      </div>

      {/* Search area */}
      <div className="flex-1 max-w-2xl mx-6 flex items-center gap-2">
        {/* Search mode toggle */}
        <div className="flex bg-secondary rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => onSearchModeChange('local')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              searchMode === 'local' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Rechercher dans la liste actuelle"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSearchModeChange('tmdb')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              searchMode === 'tmdb' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Recherche avancée TMDB"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conditional search input */}
        {searchMode === 'local' ? (
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => onLocalSearchChange(e.target.value)}
              placeholder="Filtrer la liste..."
              className="search-input pl-11 pr-10"
            />
            {localSearchQuery && (
              <button
                onClick={() => onLocalSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/20 rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        ) : (
          <SearchDropdown
            onSearch={onSearch}
            onSelectItem={onSelectSearchItem}
            isUploaded={isUploaded}
            activeCategory={activeCategory}
          />
        )}
      </div>

      {/* Progress + Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Auto-update indicator */}
        {isAutoUpdating && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>MAJ...</span>
          </div>
        )}
        
        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {uploadedCount.toLocaleString()} / {totalMedia.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {progress.toFixed(1)}% • p.{currentPage || 0}
            </p>
          </div>
          <div className="w-24">
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
          className="p-2.5 bg-secondary hover:bg-primary/20 rounded-xl transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};