import { MediaItem } from '@/types/media';
import { YTMediaCard } from './YTMediaCard';
import { ViewMode } from './YTChips';

interface YTGridProps {
  items: MediaItem[];
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
  viewMode: ViewMode;
}

export const YTGrid = ({ items, isUploaded, onToggleUpload, viewMode }: YTGridProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Aucun résultat</h3>
        <p className="text-sm text-muted-foreground">Essayez avec un autre terme de recherche</p>
      </div>
    );
  }

  const gridClass = {
    normal: 'yt-grid',
    compact: 'yt-grid-compact',
    list: 'yt-grid-list',
  }[viewMode];

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <YTMediaCard
          key={item.id}
          media={item}
          isUploaded={isUploaded(item.id)}
          onToggleUpload={() => onToggleUpload(item.id)}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};
