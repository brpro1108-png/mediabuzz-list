import { Film, Tv } from 'lucide-react';
import { Category } from '@/types/media';

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  filmCount: number;
  seriesCount: number;
}

export const CategoryTabs = ({ 
  activeCategory, 
  onCategoryChange, 
  filmCount, 
  seriesCount 
}: CategoryTabsProps) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-full w-fit">
      <button
        onClick={() => onCategoryChange('films')}
        className={`category-tab flex items-center gap-2 ${
          activeCategory === 'films' ? 'category-tab-active' : ''
        }`}
      >
        <Film className="w-4 h-4" />
        <span>Films</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          activeCategory === 'films' 
            ? 'bg-primary-foreground/20' 
            : 'bg-muted-foreground/20'
        }`}>
          {filmCount}
        </span>
      </button>
      
      <button
        onClick={() => onCategoryChange('series')}
        className={`category-tab flex items-center gap-2 ${
          activeCategory === 'series' ? 'category-tab-active' : ''
        }`}
      >
        <Tv className="w-4 h-4" />
        <span>Séries</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          activeCategory === 'series' 
            ? 'bg-primary-foreground/20' 
            : 'bg-muted-foreground/20'
        }`}>
          {seriesCount}
        </span>
      </button>
    </div>
  );
};
