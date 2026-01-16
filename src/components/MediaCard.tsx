import { useState } from 'react';
import { Film, Tv, Sparkles, FileText, Check } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { motion } from 'framer-motion';

interface MediaCardProps {
  media: MediaItem;
  isUploaded: boolean;
  onToggleUpload: () => void;
  index?: number;
}

const typeConfig = {
  movie: { icon: Film, label: 'Film', bgClass: 'bg-film/20 text-film border-film/30' },
  series: { icon: Tv, label: 'Série', bgClass: 'bg-series/20 text-series border-series/30' },
  anime: { icon: Sparkles, label: 'Anime', bgClass: 'bg-anime/20 text-anime border-anime/30' },
  documentary: { icon: FileText, label: 'Doc', bgClass: 'bg-doc/20 text-doc border-doc/30' },
};

export const MediaCard = ({ media, isUploaded, onToggleUpload, index = 0 }: MediaCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { icon: TypeIcon, label, bgClass } = typeConfig[media.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.5) }}
      className={`media-card cursor-pointer group ${isUploaded ? 'media-card-uploaded' : ''}`}
      onClick={onToggleUpload}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={imageError ? '/placeholder.svg' : media.poster}
          alt={media.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-80" />

        {/* Type badge */}
        <div className={`type-badge ${bgClass}`}>
          <TypeIcon className="w-3 h-3 inline-block mr-1" />
          <span className="text-[10px] font-medium uppercase">{label}</span>
        </div>

        {/* Uploaded badge */}
        {isUploaded && (
          <div className="uploaded-badge flex items-center gap-1.5">
            <Check className="w-3 h-3" />
            <span>Uploadé</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2 relative z-10">
        <h3 className="font-display text-sm text-foreground line-clamp-2 leading-tight group-hover:text-accent transition-colors">
          {media.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{media.year}</span>
          {media.popularity && (
            <span className="text-xs text-accent">★ {media.popularity.toFixed(1)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
