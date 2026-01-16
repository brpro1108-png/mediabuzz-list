import { Film, Tv, CheckCircle2, XCircle, Sparkles, FileText, TrendingUp, Clock, Layers } from 'lucide-react';
import { Category, ViewFilter } from '@/types/media';
import { GenreFilter } from './GenreFilter';

export type UploadFilter = 'all' | 'uploaded' | 'not_uploaded';
export type SortMode = 'default' | 'recent' | 'popular';

interface AppSidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  activeTypeFilter: string | null;
  onTypeFilterChange: (type: string | null) => void;
  uploadFilter: UploadFilter;
  onUploadFilterChange: (filter: UploadFilter) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  viewFilter: ViewFilter;
  onViewFilterChange: (filter: ViewFilter) => void;
  stats: {
    totalFilms: number;
    totalSeries: number;
    uploadedFilms: number;
    uploadedSeries: number;
  };
  selectedGenres: number[];
  onGenreToggle: (genreId: number) => void;
  onClearGenres: () => void;
}

export const AppSidebar = ({
  activeCategory,
  onCategoryChange,
  activeTypeFilter,
  onTypeFilterChange,
  uploadFilter,
  onUploadFilterChange,
  sortMode,
  onSortModeChange,
  viewFilter,
  onViewFilterChange,
  stats,
  selectedGenres,
  onGenreToggle,
  onClearGenres,
}: AppSidebarProps) => {
  const categories = [
    { 
      id: 'films' as Category, 
      label: 'Films', 
      icon: Film,
      total: stats.totalFilms,
      uploaded: stats.uploadedFilms,
    },
    { 
      id: 'series' as Category, 
      label: 'Séries', 
      icon: Tv,
      total: stats.totalSeries,
      uploaded: stats.uploadedSeries,
    },
  ];

  const seriesTypes = [
    { id: null, label: 'Tout', icon: null },
    { id: 'series', label: 'Séries TV', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Sparkles },
    { id: 'documentary', label: 'Documentaires', icon: FileText },
  ];

  const viewFilters = [
    { id: 'all' as ViewFilter, label: 'Tout', icon: null },
    { id: 'collections' as ViewFilter, label: 'Collections uniquement', icon: Layers },
  ];

  const uploadFilters = [
    { id: 'all' as UploadFilter, label: 'Tous', icon: null, color: '' },
    { id: 'uploaded' as UploadFilter, label: 'Uploadés', icon: CheckCircle2, color: 'text-uploaded' },
    { id: 'not_uploaded' as UploadFilter, label: 'Non uploadés', icon: XCircle, color: 'text-destructive' },
  ];

  const sortModes = [
    { id: 'default' as SortMode, label: 'Par défaut', icon: null },
    { id: 'recent' as SortMode, label: 'Plus récents', icon: Clock },
    { id: 'popular' as SortMode, label: 'Plus populaires', icon: TrendingUp },
  ];

  const currentCategory = categories.find(c => c.id === activeCategory);
  const currentProgress = currentCategory 
    ? (currentCategory.uploaded / Math.max(currentCategory.total, 1)) * 100 
    : 0;

  return (
    <aside className="app-sidebar">
      <div className="p-4">
        {/* Category selection */}
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Catégories
          </p>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onCategoryChange(cat.id);
                onTypeFilterChange(null);
                onClearGenres();
              }}
              className={`sidebar-item ${activeCategory === cat.id ? 'sidebar-item-active' : ''}`}
            >
              <cat.icon className="w-5 h-5" />
              <span className="flex-1">{cat.label}</span>
              <span className="text-xs opacity-60">{cat.total.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Progress for current category */}
        {currentCategory && (
          <div className="mb-6 px-2">
            <div className="stats-card">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{currentCategory.label}</span>
                <span className="text-xs text-muted-foreground">
                  {currentProgress.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar mb-2">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-uploaded">{currentCategory.uploaded.toLocaleString()} uploadés</span>
                <span>{(currentCategory.total - currentCategory.uploaded).toLocaleString()} restants</span>
              </div>
            </div>
          </div>
        )}

        {/* View filter (All vs Collections) */}
        {activeCategory === 'films' && (
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Affichage
            </p>
            {viewFilters.map((filter) => (
              <div
                key={filter.id}
                onClick={() => onViewFilterChange(filter.id)}
                className={`sidebar-item ${viewFilter === filter.id ? 'sidebar-item-active' : ''}`}
              >
                {filter.icon && <filter.icon className="w-4 h-4" />}
                {!filter.icon && <div className="w-4" />}
                <span>{filter.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Genre filter */}
        <GenreFilter
          activeCategory={activeCategory}
          selectedGenres={selectedGenres}
          onGenreToggle={onGenreToggle}
          onClearGenres={onClearGenres}
        />

        {/* Type filter for series */}
        {activeCategory === 'series' && (
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Type
            </p>
            {seriesTypes.map((type) => (
              <div
                key={type.id || 'all'}
                onClick={() => onTypeFilterChange(type.id)}
                className={`sidebar-item ${activeTypeFilter === type.id ? 'sidebar-item-active' : ''}`}
              >
                {type.icon && <type.icon className="w-4 h-4" />}
                {!type.icon && <div className="w-4" />}
                <span>{type.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Upload status filter */}
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Statut
          </p>
          {uploadFilters.map((filter) => (
            <div
              key={filter.id}
              onClick={() => onUploadFilterChange(filter.id)}
              className={`sidebar-item ${uploadFilter === filter.id ? 'sidebar-item-active' : ''}`}
            >
              {filter.icon && <filter.icon className={`w-4 h-4 ${filter.color}`} />}
              {!filter.icon && <div className="w-4" />}
              <span className={filter.color}>{filter.label}</span>
            </div>
          ))}
        </div>

        {/* Sort mode */}
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Trier par
          </p>
          {sortModes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => onSortModeChange(mode.id)}
              className={`sidebar-item ${sortMode === mode.id ? 'sidebar-item-active' : ''}`}
            >
              {mode.icon && <mode.icon className="w-4 h-4" />}
              {!mode.icon && <div className="w-4" />}
              <span>{mode.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};