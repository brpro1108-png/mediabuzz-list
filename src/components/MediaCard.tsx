import { MediaItem } from '@/types/media';
import { Check, Film, Tv, Sparkles, BookOpen } from 'lucide-react';

interface MediaCardProps {
  media: MediaItem;
  isUploaded: boolean;
  onToggleUpload: () => void;
}

const typeConfig = {
  movie: { icon: Film, label: 'Film', color: 'text-film' },
  series: { icon: Tv, label: 'Série', color: 'text-series' },
  anime: { icon: Sparkles, label: 'Anime', color: 'text-accent' },
  documentary: { icon: BookOpen, label: 'Doc', color: 'text-primary' },
};

export const MediaCard = ({ media, isUploaded, onToggleUpload }: MediaCardProps) => {
  const config = typeConfig[media.type];
  const TypeIcon = config.icon;

  return (
    <div
      onClick={onToggleUpload}
      className={`media-card cursor-pointer fade-in ${
        isUploaded ? 'media-card-uploaded' : ''
      }`}
    >
      {/* Uploaded Badge */}
      {isUploaded && (
        <div className="uploaded-badge flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>Déjà upload</span>
        </div>
      )}

      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={media.poster}
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <TypeIcon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">• {media.year}</span>
        </div>
        
        <h3 className="font-display font-semibold text-foreground line-clamp-2 leading-tight">
          {media.title}
        </h3>

        {media.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {media.description}
          </p>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
