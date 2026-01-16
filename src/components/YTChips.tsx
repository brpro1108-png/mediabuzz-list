import { Tv, Sparkles, FileText, Clock, TrendingUp, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { Category } from '@/types/media';

export type SortFilter = 'recent' | 'popular' | null;
export type UploadFilter = 'uploaded' | 'not_uploaded' | null;
export type ViewMode = 'normal' | 'compact' | 'list';

interface YTChipsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  activeTypeFilter: string | null;
  onTypeFilterChange: (type: string | null) => void;
  sortFilter: SortFilter;
  onSortFilterChange: (filter: SortFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const YTChips = ({ 
  activeCategory, 
  onCategoryChange,
  activeTypeFilter,
  onTypeFilterChange,
  sortFilter,
  onSortFilterChange,
  viewMode,
  onViewModeChange,
}: YTChipsProps) => {
  const categoryChips = [
    { id: 'films' as Category, label: 'Films' },
    { id: 'series' as Category, label: 'Séries' },
  ];

  const seriesTypeChips = [
    { id: null, label: 'Tout' },
    { id: 'series', label: 'Séries TV', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Sparkles },
    { id: 'documentary', label: 'Docs', icon: FileText },
  ];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide flex-1">
      {/* Main category chips */}
      {categoryChips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => {
            onCategoryChange(chip.id);
            onTypeFilterChange(null);
          }}
          className={`chip whitespace-nowrap ${activeCategory === chip.id ? 'chip-active' : ''}`}
        >
          {chip.label}
        </button>
      ))}

      {/* Separator */}
      <div className="h-8 w-px bg-border flex-shrink-0" />

      {/* Type filters for series */}
      {activeCategory === 'series' && (
        <>
          {seriesTypeChips.map((chip) => (
            <button
              key={chip.id || 'all'}
              onClick={() => onTypeFilterChange(chip.id)}
              className={`chip whitespace-nowrap flex items-center gap-2 ${activeTypeFilter === chip.id ? 'chip-active' : ''}`}
            >
              {chip.icon && <chip.icon className="w-4 h-4" />}
              {chip.label}
            </button>
          ))}
          <div className="h-8 w-px bg-border flex-shrink-0" />
        </>
      )}

      {/* Sort filter chips */}
      <button 
        onClick={() => onSortFilterChange(sortFilter === 'recent' ? null : 'recent')}
        className={`chip whitespace-nowrap flex items-center gap-2 ${sortFilter === 'recent' ? 'chip-active' : ''}`}
      >
        <Clock className="w-4 h-4" />
        Récents
      </button>
      <button 
        onClick={() => onSortFilterChange(sortFilter === 'popular' ? null : 'popular')}
        className={`chip whitespace-nowrap flex items-center gap-2 ${sortFilter === 'popular' ? 'chip-active' : ''}`}
      >
        <TrendingUp className="w-4 h-4" />
        Populaires
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-border flex-shrink-0" />

      {/* View mode chips */}
      <button 
        onClick={() => onViewModeChange('normal')}
        className={`chip whitespace-nowrap flex items-center gap-2 ${viewMode === 'normal' ? 'chip-active' : ''}`}
        title="Vue normale"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button 
        onClick={() => onViewModeChange('compact')}
        className={`chip whitespace-nowrap flex items-center gap-2 ${viewMode === 'compact' ? 'chip-active' : ''}`}
        title="Vue compacte"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button 
        onClick={() => onViewModeChange('list')}
        className={`chip whitespace-nowrap flex items-center gap-2 ${viewMode === 'list' ? 'chip-active' : ''}`}
        title="Vue liste"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
};
