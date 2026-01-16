import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types/media';

interface SmartCollectionBarProps {
  activeSmartCategory: string | null;
  onSmartCategoryChange: (category: string | null) => void;
  mediaCategory: Category;
}

// Movie collection categories
const MOVIE_CATEGORIES = [
  'Tous',
  'Tendances',
  'Box Office',
  'Sagas',
  'Studios',
  'Genres',
  'Awards',
  'International',
  'Plateformes',
  'Spécial',
];

// Series collection categories
const SERIES_CATEGORIES = [
  'Tous',
  'Tendances Séries',
  'K-Drama',
  'Plateformes',
  'International',
  'Genres',
  'Classiques TV',
  'Animations',
];

export const SmartCollectionBar = ({ activeSmartCategory, onSmartCategoryChange, mediaCategory }: SmartCollectionBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const categories = mediaCategory === 'films' ? MOVIE_CATEGORIES : SERIES_CATEGORIES;

  return (
    <div className="mb-6">
      {/* Category Tabs */}
      <div className="relative">
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/90 rounded-full shadow-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div 
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto px-10 pb-2 scrollbar-hide"
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onSmartCategoryChange(cat === 'Tous' ? null : cat)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                (activeSmartCategory === cat) || (cat === 'Tous' && !activeSmartCategory)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/90 rounded-full shadow-lg hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};