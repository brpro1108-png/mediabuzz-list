import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem, MediaCollection } from '@/types/media';

interface MediaCollectionItemProps {
  collection: MediaCollection;
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
}

const ITEMS_PER_PAGE = 20;

export const MediaCollectionItem = ({ collection, isUploaded, onToggleUpload }: MediaCollectionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const uploadedCount = collection.items.filter(item => isUploaded(item.id)).length;
  const allUploaded = uploadedCount === collection.items.length;
  const partiallyUploaded = uploadedCount > 0 && !allUploaded;

  // Sort items by release date
  const sortedItems = useMemo(() => {
    return [...collection.items].sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''));
  }, [collection.items]);

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  const handleToggleAll = () => {
    const shouldUpload = !allUploaded;
    collection.items.forEach(item => {
      const currentlyUploaded = isUploaded(item.id);
      if (shouldUpload !== currentlyUploaded) {
        onToggleUpload(item.id);
      }
    });
  };

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      allUploaded ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
    }`}>
      {/* Collection Header */}
      <div 
        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-accent/50 rounded-t-xl transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Collection Poster */}
        <div className="relative flex-shrink-0">
          {!imageLoaded && !imageError && (
            <div className="skeleton w-16 h-24 rounded-lg" />
          )}
          <img
            src={imageError || !collection.poster ? '/placeholder.svg' : collection.poster}
            alt={collection.name}
            className={`w-16 h-24 object-cover rounded-lg ${imageLoaded ? 'block' : 'hidden'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {collection.items.length}
          </div>
        </div>

        {/* Collection Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate">{collection.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {collection.items.length} films • {uploadedCount} uploadé{uploadedCount > 1 ? 's' : ''}
          </p>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(uploadedCount / collection.items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Status & Expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleAll();
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              allUploaded 
                ? 'bg-primary text-primary-foreground' 
                : partiallyUploaded
                  ? 'bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {allUploaded ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Uploadé
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {partiallyUploaded ? `${uploadedCount}/${collection.items.length}` : 'Uploader tout'}
              </span>
            )}
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Items with Pagination */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Pagination Header */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} / {totalPages} ({sortedItems.length} éléments)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(1);
                  }}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <ChevronLeft className="w-4 h-4 -ml-2" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(p => Math.max(1, p - 1));
                  }}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium">{currentPage}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(totalPages);
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4 -ml-2" />
                </button>
              </div>
            </div>
          )}
          
          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3">
            {paginatedItems.map((item) => (
              <div 
                key={item.id}
                className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                  isUploaded(item.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onToggleUpload(item.id)}
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t border-border">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 10) {
                  pageNum = i + 1;
                } else if (currentPage <= 5) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 4) {
                  pageNum = totalPages - 9 + i;
                } else {
                  pageNum = currentPage - 4 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPage(pageNum);
                    }}
                    className={`min-w-[32px] h-8 rounded text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};