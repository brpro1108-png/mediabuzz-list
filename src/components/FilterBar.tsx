import { useState } from 'react';
import { ChevronDown, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { FilterOptions, SortOption } from '@/types/media';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableYears: number[];
  activeCategory: 'films' | 'series';
}

export const FilterBar = ({
  filters,
  onFiltersChange,
  availableYears,
  activeCategory,
}: FilterBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeOptions = activeCategory === 'films' 
    ? [{ value: 'movie' as const, label: 'Films' }]
    : [
        { value: 'series' as const, label: 'Séries' },
        { value: 'anime' as const, label: 'Animes' },
        { value: 'documentary' as const, label: 'Documentaires' },
      ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'title', label: 'Titre' },
    { value: 'year', label: 'Année' },
    { value: 'popularity', label: 'Popularité' },
  ];

  const toggleType = (type: 'movie' | 'series' | 'anime' | 'documentary') => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const setSortBy = (sortBy: SortOption) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const toggleSortDirection = () => {
    onFiltersChange({
      ...filters,
      sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  };

  const setYearRange = (range: [number, number] | undefined) => {
    onFiltersChange({ ...filters, yearRange: range });
  };

  const hasActiveFilters =
    (filters.yearRange !== undefined) ||
    (activeCategory === 'series' && filters.types.length > 0 && filters.types.length < 3);

  return (
    <div className="filter-panel p-4 space-y-4">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 text-foreground hover:text-accent transition-colors w-full"
      >
        <Filter className="w-5 h-5" />
        <span className="font-display uppercase tracking-wider text-sm">Filtres & Tri</span>
        {hasActiveFilters && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
            Actif
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-4 border-t border-border">
              {/* Type filters (only for series category) */}
              {activeCategory === 'series' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                    Type
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => toggleType(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.types.length === 0 || filters.types.includes(option.value)
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-secondary text-muted-foreground border border-border hover:border-primary/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Year filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                    Année
                  </h4>
                  {filters.yearRange && (
                    <button
                      onClick={() => setYearRange(undefined)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Effacer
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '2024+', range: [2024, 2030] as [number, number] },
                    { label: '2020-2023', range: [2020, 2023] as [number, number] },
                    { label: '2015-2019', range: [2015, 2019] as [number, number] },
                    { label: '2010-2014', range: [2010, 2014] as [number, number] },
                    { label: 'Avant 2010', range: [1900, 2009] as [number, number] },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() =>
                        setYearRange(
                          filters.yearRange?.[0] === option.range[0] ? undefined : option.range
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.yearRange?.[0] === option.range[0]
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground border border-border hover:border-accent/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort options */}
              <div className="space-y-3">
                <h4 className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                  Trier par
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.sortBy === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground border border-border hover:border-primary/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={toggleSortDirection}
                    className="p-2 rounded-lg bg-secondary border border-border hover:border-primary/40 transition-all"
                    title={filters.sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
                  >
                    {filters.sortDirection === 'asc' ? (
                      <SortAsc className="w-5 h-5" />
                    ) : (
                      <SortDesc className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
