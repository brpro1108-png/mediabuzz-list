import { Film, Tv, Sparkles, FileText } from 'lucide-react';
import { Category } from '@/types/media';

interface YTChipsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  activeTypeFilter: string | null;
  onTypeFilterChange: (type: string | null) => void;
}

export const YTChips = ({ 
  activeCategory, 
  onCategoryChange,
  activeTypeFilter,
  onTypeFilterChange,
}: YTChipsProps) => {
  const categoryChips = [
    { id: 'films' as Category, label: 'Films' },
    { id: 'series' as Category, label: 'Séries' },
  ];

  const seriesTypeChips = [
    { id: null, label: 'Tout' },
    { id: 'series', label: 'Séries TV', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Sparkles },
    { id: 'documentary', label: 'Documentaires', icon: FileText },
  ];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
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
      {activeCategory === 'series' && seriesTypeChips.map((chip) => (
        <button
          key={chip.id || 'all'}
          onClick={() => onTypeFilterChange(chip.id)}
          className={`chip whitespace-nowrap flex items-center gap-2 ${activeTypeFilter === chip.id ? 'chip-active' : ''}`}
        >
          {chip.icon && <chip.icon className="w-4 h-4" />}
          {chip.label}
        </button>
      ))}

      {/* Additional filter chips */}
      <button className="chip whitespace-nowrap">Récents</button>
      <button className="chip whitespace-nowrap">Populaires</button>
      <button className="chip whitespace-nowrap">Uploadés</button>
      <button className="chip whitespace-nowrap">Non uploadés</button>
    </div>
  );
};
