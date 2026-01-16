import { useState } from 'react';
import { Film, Tv, Sparkles, FileText, Check } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface YTMediaCardProps {
  media: MediaItem;
  isUploaded: boolean;
  onToggleUpload: () => void;
}

const typeConfig = {
  movie: { icon: Film, label: 'Film', color: 'bg-film' },
  series: { icon: Tv, label: 'Série', color: 'bg-series' },
  anime: { icon: Sparkles, label: 'Anime', color: 'bg-anime' },
  documentary: { icon: FileText, label: 'Doc', color: 'bg-doc' },
};

export const YTMediaCard = ({ media, isUploaded, onToggleUpload }: YTMediaCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { icon: TypeIcon, label, color } = typeConfig[media.type];

  return (
    <div className="yt-card" onClick={onToggleUpload}>
      {/* Thumbnail */}
      <div className="relative">
        {!imageLoaded && !imageError && (
          <div className="skeleton w-full aspect-video" />
        )}
        <img
          src={imageError ? '/placeholder.svg' : media.poster}
          alt={media.title}
          className={`yt-thumbnail ${imageLoaded ? 'block' : 'hidden'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        {/* Duration-like badge showing year */}
        <div className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
          {media.year || 'N/A'}
        </div>

        {/* Uploaded badge */}
        {isUploaded && (
          <div className="uploaded-badge-yt flex items-center gap-1">
            <Check className="w-3 h-3" />
            Uploadé
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-xl" />
      </div>

      {/* Info */}
      <div className="flex gap-3 mt-3">
        {/* Channel avatar - using type icon */}
        <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
          <TypeIcon className="w-4 h-4 text-white" />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {media.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {label}
          </p>
          <p className="text-xs text-muted-foreground">
            {media.popularity ? `${Math.round(media.popularity)} vues` : ''}
            {media.year && ` • ${media.year}`}
          </p>
        </div>
      </div>
    </div>
  );
};
