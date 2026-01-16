import { useState, useRef, useMemo } from 'react';
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

// Generate all box office years
const BOX_OFFICE_YEARS = Array.from({ length: 36 }, (_, i) => 2025 - i);

// Group collections by category for better UX
const COLLECTION_CATEGORIES = {
  'Tendances': ['trending', 'now_playing', 'upcoming', 'top_rated'],
  'Box Office': BOX_OFFICE_YEARS.map(y => `box_office_${y}`),
  'Sagas': ['harrypotter', 'lotr', 'hobbit', 'starwars', 'bond', 'fast', 'jurassic', 'transformers', 'mission', 'pirates', 'matrix', 'avengers', 'xmen', 'batman', 'spiderman', 'iceage', 'shrek', 'toystory', 'despicableme', 'hungergames', 'twilight', 'indianajones', 'alien', 'terminator', 'rocky', 'diehard', 'bourne', 'johnwick', 'godfather', 'backtothefuture', 'madmax'],
  'Studios': ['marvel', 'dc', 'disney', 'pixar', 'ghibli', 'dreamworks', 'warner', 'universal', 'paramount', 'sony', 'lionsgate', 'fox', 'mgm'],
  'Genres': ['action', 'comedy', 'horror', 'romance', 'scifi', 'thriller', 'family', 'classics', 'war', 'musicals', 'animation', 'adventure', 'crime', 'mystery', 'western'],
  'Awards': ['oscar', 'palme', 'golden_globe', 'bafta'],
  'International': ['french', 'korean', 'kdrama', 'japanese', 'bollywood', 'spanish', 'latino', 'turkish', 'chinese', 'british', 'italian', 'german', 'arabic', 'thai', 'vietnamese'],
  'Plateformes': ['netflix', 'disneyplus', 'hbo', 'prime', 'appletv', 'hulu', 'peacock', 'paramount_plus', 'showtime', 'starz'],
  'Spécial': ['christmas', 'halloween', 'superhero', 'sports', 'biography', 'historical'],
};

const ITEMS_PER_PAGE = 50;

export const SmartCollectionBar = ({ collections, isUploaded, onToggleUpload }: SmartCollectionBarProps) => {
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Tendances');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Get current collection items with pagination
  const currentCollectionItems = useMemo(() => {
    if (!expandedCollection || !collections[expandedCollection]) return [];
    return collections[expandedCollection];
  }, [expandedCollection, collections]);

  const totalPages = Math.ceil(currentCollectionItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentCollectionItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentCollectionItems, currentPage]);

  // Reset page when collection changes
  const handleExpandCollection = (id: string) => {
    if (expandedCollection === id) {
      setExpandedCollection(null);
    } else {
      setExpandedCollection(id);
      setCurrentPage(1);
    }
  };

  // Get collection name
  const getCollectionName = (id: string) => {
    const config = SMART_COLLECTIONS[id as keyof typeof SMART_COLLECTIONS];
    if (config) return config.name;
    
    // Handle dynamic box office years
    if (id.startsWith('box_office_')) {
      const year = id.replace('box_office_', '');
      return `💰 Box Office ${year}`;
    }
    return id;
  };

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
              setCurrentPage(1);
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
          {availableCollections.length === 0 && currentCollectionIds.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
              <span>Chargement des collections...</span>
            </div>
          )}
          {availableCollections.map(id => {
            const items = collections[id] || [];
            const stats = getCollectionStats(items);
            const isExpanded = expandedCollection === id;
            const allUploaded = stats.uploaded === stats.total && stats.total > 0;
            
            return (
              <button
                key={id}
                onClick={() => handleExpandCollection(id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isExpanded 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : allUploaded
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-card border border-border text-foreground hover:bg-accent hover:border-primary/50'
                }`}
              >
                {COLLECTION_ICONS[id] || (items[0]?.type === 'series' ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />)}
                <span className="whitespace-nowrap">{getCollectionName(id)}</span>
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

      {/* Expanded Collection View with Pagination */}
      {expandedCollection && collections[expandedCollection] && (
        <div className="mt-4 p-4 bg-card rounded-xl border border-border animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-foreground text-lg">
                {getCollectionName(expandedCollection)}
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

          {/* Pagination Header */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-4 px-2 py-2 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} / {totalPages} ({currentCollectionItems.length} éléments)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-40"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-40"
                >
                  «
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[28px] h-7 text-xs rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-40"
                >
                  »
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-40"
                >
                  »»
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {paginatedItems.map((item) => (
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