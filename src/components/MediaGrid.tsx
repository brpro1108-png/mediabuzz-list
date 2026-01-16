import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
}

export const MediaGrid = ({ items, isUploaded, onToggleUpload }: MediaGridProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-1">
          Aucun résultat
        </h3>
        <p className="text-sm text-muted-foreground">
          Essayez avec un autre terme de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          isUploaded={isUploaded(item.id)}
          onToggleUpload={() => onToggleUpload(item.id)}
        />
      ))}
    </div>
  );
};
