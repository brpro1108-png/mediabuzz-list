import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Clock, TrendingUp, Calendar, Star, Trophy, Clapperboard, Sparkles } from 'lucide-react';
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

export const SmartCollectionBar = ({ collections, isUploaded, onToggleUpload }: SmartCollectionBarProps) => {
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const collectionEntries = Object.entries(SMART_COLLECTIONS).filter(
    ([id]) => collections[id] && collections[id].length > 0
  );

  if (collectionEntries.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('smart-collections-container');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Collections Intelligentes
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collection Pills */}
      <div 
        id="smart-collections-container"
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {collectionEntries.map(([id, config]) => {
          const items = collections[id] || [];
          const stats = getCollectionStats(items);
          const isExpanded = expandedCollection === id;
          const allUploaded = stats.uploaded === stats.total;
          
          return (
            <button
              key={id}
              onClick={() => setExpandedCollection(isExpanded ? null : id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isExpanded 
                  ? 'bg-primary text-primary-foreground scale-105'
                  : allUploaded
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-secondary text-foreground hover:bg-accent'
              }`}
              style={{ 
                borderLeft: isExpanded ? 'none' : `3px solid ${config.color}` 
              }}
            >
              {COLLECTION_ICONS[id] || COLLECTION_ICONS.default}
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

      {/* Expanded Collection View */}
      {expandedCollection && collections[expandedCollection] && (
        <div className="mt-4 p-4 bg-card rounded-xl border border-border animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-foreground">
                {SMART_COLLECTIONS[expandedCollection as keyof typeof SMART_COLLECTIONS]?.name}
              </h4>
              <span className="text-sm text-muted-foreground">
                {getCollectionStats(collections[expandedCollection]).uploaded} / {collections[expandedCollection].length} uploadés
              </span>
            </div>
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
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {collections[expandedCollection].slice(0, 16).map((item) => (
              <div
                key={item.id}
                onClick={() => onToggleUpload(item.id)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-105 ${
                  isUploaded(item.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={item.poster || '/placeholder.svg'}
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  isUploaded(item.id) ? 'bg-primary/50' : 'bg-black/0 group-hover:bg-black/50'
                }`}>
                  {isUploaded(item.id) ? (
                    <Check className="w-8 h-8 text-white" />
                  ) : (
                    <Clock className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white font-medium truncate">{item.title}</p>
                  <p className="text-xs text-white/70">{item.year}</p>
                </div>
              </div>
            ))}
          </div>

          {collections[expandedCollection].length > 16 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              +{collections[expandedCollection].length - 16} autres médias
            </p>
          )}
        </div>
      )}
    </div>
  );
};