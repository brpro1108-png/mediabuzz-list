import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, Layers } from 'lucide-react';
import { MediaItem, MediaCollection } from '@/types/media';

interface MediaCollectionItemProps {
  collection: MediaCollection;
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
}

export const MediaCollectionItem = ({ collection, isUploaded, onToggleUpload }: MediaCollectionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const uploadedCount = collection.items.filter(item => isUploaded(item.id)).length;
  const allUploaded = uploadedCount === collection.items.length;
  const partiallyUploaded = uploadedCount > 0 && !allUploaded;

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

      {/* Expanded Items */}
      {isExpanded && (
        <div className="border-t border-border">
          {collection.items
            .sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''))
            .map((item, index) => (
              <div 
                key={item.id}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                  isUploaded(item.id) ? 'bg-primary/10' : 'hover:bg-accent/50'
                } ${index !== collection.items.length - 1 ? 'border-b border-border/50' : 'rounded-b-xl'}`}
                onClick={() => onToggleUpload(item.id)}
              >
                <img
                  src={item.poster || '/placeholder.svg'}
                  alt={item.title}
                  className="w-10 h-15 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.year}</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isUploaded(item.id) ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground'
                }`}>
                  {isUploaded(item.id) && <Check className="w-4 h-4" />}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};