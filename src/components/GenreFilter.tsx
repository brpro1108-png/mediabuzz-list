import { Category, MOVIE_GENRES, SERIES_GENRES, Genre } from '@/types/media';
import { ChevronDown, ChevronUp, Tags } from 'lucide-react';
import { useState } from 'react';

interface GenreFilterProps {
  activeCategory: Category;
  selectedGenres: number[];
  onGenreToggle: (genreId: number) => void;
  onClearGenres: () => void;
}

export const GenreFilter = ({
  activeCategory,
  selectedGenres,
  onGenreToggle,
  onClearGenres,
}: GenreFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const genres: Genre[] = activeCategory === 'films' ? MOVIE_GENRES : SERIES_GENRES;
  const displayedGenres = isExpanded ? genres : genres.slice(0, 6);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Tags className="w-3.5 h-3.5" />
          Genres
        </p>
        {selectedGenres.length > 0 && (
          <button
            onClick={onClearGenres}
            className="text-xs text-primary hover:underline"
          >
            Effacer ({selectedGenres.length})
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1.5 px-2">
        {displayedGenres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onGenreToggle(genre.id)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              selectedGenres.includes(genre.id)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {genres.length > 6 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 px-2 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Voir plus ({genres.length - 6})
            </>
          )}
        </button>
      )}
    </div>
  );
};
