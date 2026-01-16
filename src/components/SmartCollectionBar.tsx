import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, Clock, TrendingUp, Calendar, Star, Trophy, Clapperboard, Sparkles, Film, Tv } from 'lucide-react';
import { MediaItem, SMART_COLLECTIONS } from '@/types/media';

interface SmartCollectionBarProps {
  collections: Record<string, MediaItem[]>;
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
}

const COLLECTION_ICONS: Record<string, React.ReactNode> = {
  trending: <TrendingUp className="w-4 h-4" />,
  now_playing: <Clapperboard className="w-4 h-4" />,
  upcoming: <Calendar className="w-4 h-4" />,
  top_rated: <Star className="w-4 h-4" />,
  oscar: <Trophy className="w-4 h-4" />,
  default: <Sparkles className="w-4 h-4" />,
};

// Group collections by category for better UX
const COLLECTION_CATEGORIES = {
  'Tendances': ['trending', 'now_playing', 'upcoming', 'top_rated'],
  'Box Office': ['box_office_2025', 'box_office_2024', 'box_office_2023', 'box_office_2022', 'box_office_2021', 'box_office_2020', 'box_office_2019', 'box_office_2018', 'box_office_2017', 'box_office_2016', 'box_office_2015', 'box_office_2010s', 'box_office_2000s', 'box_office_90s'],
  'Sagas': ['harrypotter', 'lotr', 'starwars', 'bond', 'fast', 'jurassic', 'transformers', 'mission'],
  'Studios': ['marvel', 'dc', 'disney', 'pixar', 'ghibli', 'dreamworks'],
  'Genres': ['action', 'comedy', 'horror', 'romance', 'scifi', 'thriller', 'family', 'classics', 'war', 'musicals'],
  'Awards': ['oscar', 'palme'],
  'International': ['french', 'korean', 'kdrama', 'japanese', 'bollywood', 'spanish', 'latino', 'turkish', 'chinese', 'british'],
  'Plateformes': ['netflix', 'disneyplus', 'hbo', 'prime', 'appletv'],
  'Spécial': ['christmas', 'halloween', 'superhero'],
};

export const SmartCollectionBar = ({ collections, isUploaded, onToggleUpload }: SmartCollectionBarProps) => {
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Tendances');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getCollectionStats = (items: MediaItem[]) => {
    const uploaded = items.filter(item => isUploaded(item.id)).length;
    return { uploaded, total: items.length };
  };

  const handleToggleAll = (items: MediaItem[]) => {
    const allUploaded = items.every(item => isUploaded(item.id));
    items.forEach(item => {
      if (allUploaded !== isUploaded(item.id)) {
        onToggleUpload(item.id);
      }
    });
  };

  const currentCollectionIds = COLLECTION_CATEGORIES[activeCategory as keyof typeof COLLECTION_CATEGORIES] || [];
  const availableCollections = currentCollectionIds.filter(id => collections[id] && collections[id].length > 0);

  return (
    <div className="mb-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(COLLECTION_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setExpandedCollection(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Collection Pills */}
      <div className="relative">
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/90 rounded-full shadow-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-8 pb-2 scrollbar-hide"
        >
          {availableCollections.map(id => {
            const config = SMART_COLLECTIONS[id as keyof typeof SMART_COLLECTIONS];
            if (!config) return null;
            
            const items = collections[id] || [];
            const stats = getCollectionStats(items);
            const isExpanded = expandedCollection === id;
            const allUploaded = stats.uploaded === stats.total && stats.total > 0;
            
            return (
              <button
                key={id}
                onClick={() => setExpandedCollection(isExpanded ? null : id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isExpanded 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : allUploaded
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-card border border-border text-foreground hover:bg-accent hover:border-primary/50'
                }`}
              >
                {COLLECTION_ICONS[id] || (items[0]?.type === 'series' ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />)}
                <span className="whitespace-nowrap">{config.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  allUploaded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {stats.uploaded}/{stats.total}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/90 rounded-full shadow-lg hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Collection View */}
      {expandedCollection && collections[expandedCollection] && (
        <div className="mt-4 p-4 bg-card rounded-xl border border-border animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-foreground text-lg">
                {SMART_COLLECTIONS[expandedCollection as keyof typeof SMART_COLLECTIONS]?.name}
              </h4>
              <span className="text-sm text-muted-foreground">
                {getCollectionStats(collections[expandedCollection]).uploaded} / {collections[expandedCollection].length} uploadés
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAll(collections[expandedCollection])}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  getCollectionStats(collections[expandedCollection]).uploaded === collections[expandedCollection].length
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {getCollectionStats(collections[expandedCollection]).uploaded === collections[expandedCollection].length
                  ? '✓ Tout uploadé'
                  : 'Tout uploader'
                }
              </button>
              <button
                onClick={() => setExpandedCollection(null)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {collections[expandedCollection].map((item) => (
              <div
                key={item.id}
                onClick={() => onToggleUpload(item.id)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all hover:scale-105 hover:z-10 ${
                  isUploaded(item.id) ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                <img
                  src={item.poster || '/placeholder.svg'}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="lazy"
                />
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  isUploaded(item.id) ? 'bg-primary/60' : 'bg-black/0 group-hover:bg-black/60'
                }`}>
                  {isUploaded(item.id) ? (
                    <Check className="w-8 h-8 text-white drop-shadow-lg" />
                  ) : (
                    <Clock className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2">
                  <p className="text-xs text-white font-medium truncate">{item.title}</p>
                  <p className="text-xs text-white/70">{item.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};