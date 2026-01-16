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
        <div className="p-6 rounded-full bg-muted/30 border border-border mb-6">
          <svg className="w-16 h-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="font-display text-xl text-foreground mb-2">Aucun résultat trouvé</h3>
        <p className="text-muted-foreground font-body italic">Les archives ne contiennent aucune entrée correspondante</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {items.map((item, index) => (
        <MediaCard
          key={item.id}
          media={item}
          isUploaded={isUploaded(item.id)}
          onToggleUpload={() => onToggleUpload(item.id)}
          index={index}
        />
      ))}
    </div>
  );
};
