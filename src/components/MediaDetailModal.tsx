import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Tv, Sparkles, FileText, Calendar, Star } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface MediaDetailModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  isUploaded: boolean;
  onToggleUpload: () => void;
}

const typeConfig = {
  movie: { icon: Film, label: 'Film', color: 'text-film' },
  series: { icon: Tv, label: 'Série', color: 'text-series' },
  anime: { icon: Sparkles, label: 'Anime', color: 'text-anime' },
  documentary: { icon: FileText, label: 'Documentaire', color: 'text-doc' },
};

export const MediaDetailModal = ({
  media,
  isOpen,
  onClose,
  isUploaded,
  onToggleUpload,
}: MediaDetailModalProps) => {
  if (!media) return null;

  const { icon: TypeIcon, label: typeLabel, color } = typeConfig[media.type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 modal-overlay z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4"
          >
            <div className="modal-content overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Poster */}
                <div className="relative w-full md:w-1/3 aspect-[2/3] flex-shrink-0">
                  <img
                    src={media.poster}
                    alt={media.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent md:bg-gradient-to-r" />
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-4">
                  {/* Type badge */}
                  <div className={`inline-flex items-center gap-2 ${color}`}>
                    <TypeIcon className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase tracking-wider font-display">
                      {typeLabel}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
                    {media.title}
                  </h2>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{media.year}</span>
                    </div>
                    {media.popularity && (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-accent" />
                        <span>{media.popularity.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  {media.genres && media.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {media.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground border border-border"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {media.description && (
                    <p className="text-muted-foreground leading-relaxed font-body text-sm md:text-base">
                      {media.description}
                    </p>
                  )}

                  {/* Upload button */}
                  <button
                    onClick={onToggleUpload}
                    className={`w-full py-3 px-6 rounded-lg font-display uppercase tracking-wider text-sm transition-all duration-300 ${
                      isUploaded
                        ? 'bg-uploaded text-uploaded-foreground shadow-lg shadow-uploaded/30'
                        : 'bg-secondary hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary'
                    }`}
                  >
                    {isUploaded ? '✓ Déjà uploadé' : 'Marquer comme uploadé'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
