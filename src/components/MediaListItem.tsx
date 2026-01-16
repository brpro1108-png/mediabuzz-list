import { useState } from 'react';
import { Film, Tv, Sparkles, FileText, Check, Clock } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface MediaListItemProps {
  media: MediaItem;
  isUploaded: boolean;
  onToggleUpload: () => void;
}

const typeConfig = {
  movie: { icon: Film, label: 'Film', badgeClass: 'type-badge-movie', color: 'bg-film' },
  series: { icon: Tv, label: 'Série', badgeClass: 'type-badge-series', color: 'bg-series' },
  anime: { icon: Sparkles, label: 'Anime', badgeClass: 'type-badge-anime', color: 'bg-anime' },
  documentary: { icon: FileText, label: 'Doc', badgeClass: 'type-badge-doc', color: 'bg-doc' },
};

export const MediaListItem = ({ media, isUploaded, onToggleUpload }: MediaListItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const config = typeConfig[media.type];
  const TypeIcon = config.icon;

  return (
    <div 
      className={`media-item ${isUploaded ? 'media-item-uploaded' : ''}`}
      onClick={onToggleUpload}
    >
      {/* Poster */}
      <div className="relative">
        {!imageLoaded && !imageError && (
          <div className="skeleton w-16 h-24 rounded-lg" />
        )}
        <img
          src={imageError ? '/placeholder.svg' : media.poster}
          alt={media.title}
          className={`media-poster ${imageLoaded ? 'block' : 'hidden'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {media.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`type-badge ${config.badgeClass}`}>
                {config.label}
              </span>
              {media.year && (
                <span className="text-sm text-muted-foreground">{media.year}</span>
              )}
              {media.popularity && (
                <span className="text-sm text-muted-foreground">
                  {Math.round(media.popularity).toLocaleString()} pop.
                </span>
              )}
            </div>
            {media.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                {media.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload status */}
      <div className="flex-shrink-0">
        {isUploaded ? (
          <div className="upload-status upload-status-done">
            <Check className="w-4 h-4" />
            <span>Uploadé</span>
          </div>
        ) : (
          <div className="upload-status upload-status-pending">
            <Clock className="w-4 h-4" />
            <span>En attente</span>
          </div>
        )}
      </div>
    </div>
  );
};