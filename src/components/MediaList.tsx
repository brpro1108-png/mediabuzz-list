import { MediaItem } from '@/types/media';
import { MediaListItem } from './MediaListItem';

interface MediaListProps {
  items: MediaItem[];
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
}

export const MediaList = ({ items, isUploaded, onToggleUpload }: MediaListProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Aucun résultat</h3>
        <p className="text-sm text-muted-foreground">Essayez avec d'autres filtres</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <MediaListItem
          key={`${item.id}-${index}`}
          media={item}
          isUploaded={isUploaded(item.id)}
          onToggleUpload={() => onToggleUpload(item.id)}
        />
      ))}
    </div>
  );
};