import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Film, Tv, Clock } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface SearchDropdownProps {
  onSearch: (query: string, category: 'movies' | 'series') => Promise<MediaItem[]>;
  onSelectItem: (item: MediaItem) => void;
  isUploaded: (id: string) => boolean;
  activeCategory: 'films' | 'series';
}

export const SearchDropdown = ({ 
  onSearch, 
  onSelectItem, 
  isUploaded,
  activeCategory 
}: SearchDropdownProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const category = activeCategory === 'films' ? 'movies' : 'series';
      const searchResults = await onSearch(searchQuery, category);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, activeCategory]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectItem = (item: MediaItem) => {
    onSelectItem(item);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative flex-1 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Rechercher sur TMDB en temps réel..."
          className="search-input pl-11 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-3 py-2">
              {results.length} résultats TMDB
            </p>
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
              >
                {item.poster ? (
                  <img 
                    src={item.poster} 
                    alt={item.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center">
                    {item.type === 'movie' ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{item.year}</span>
                    {item.genreNames && item.genreNames.length > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.genreNames.slice(0, 2).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  isUploaded(item.id) 
                    ? 'bg-uploaded/20 text-uploaded' 
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {isUploaded(item.id) ? 'Uploadé' : 'Non uploadé'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 p-6 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Aucun résultat pour "{query}"</p>
        </div>
      )}
    </div>
  );
};
