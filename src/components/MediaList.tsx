import { useMemo } from 'react';
import { MediaItem, MediaCollection } from '@/types/media';
import { MediaListItem } from './MediaListItem';
import { MediaCollectionItem } from './MediaCollectionItem';
import { MediaPagination } from './MediaPagination';

interface MediaListProps {
  items: MediaItem[];
  isUploaded: (id: string) => boolean;
  onToggleUpload: (id: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export const MediaList = ({ 
  items, 
  isUploaded, 
  onToggleUpload, 
  currentPage, 
  onPageChange,
  itemsPerPage = 100 
}: MediaListProps) => {
  
  // Group items by collection and individual items
  const { collections, individualItems, totalItems } = useMemo(() => {
    const collectionMap = new Map<number, MediaItem[]>();
    const individual: MediaItem[] = [];

    items.forEach(item => {
      if (item.collectionId && item.collectionName) {
        const existing = collectionMap.get(item.collectionId) || [];
        existing.push(item);
        collectionMap.set(item.collectionId, existing);
      } else {
        individual.push(item);
      }
    });

    // Only create collections for groups of 2+ items
    const collections: MediaCollection[] = [];
    const singleFromCollections: MediaItem[] = [];

    collectionMap.forEach((collectionItems, collectionId) => {
      if (collectionItems.length >= 2) {
        collections.push({
          id: collectionId,
          name: collectionItems[0].collectionName || 'Collection',
          poster: collectionItems[0].poster,
          items: collectionItems,
          isFullyUploaded: collectionItems.every(item => isUploaded(item.id)),
        });
      } else {
        singleFromCollections.push(...collectionItems);
      }
    });

    const allIndividual = [...individual, ...singleFromCollections];

    return {
      collections,
      individualItems: allIndividual,
      totalItems: collections.length + allIndividual.length,
    };
  }, [items, isUploaded]);

  // Combine collections and individual items for pagination
  const allDisplayItems = useMemo(() => {
    const displayItems: Array<{ type: 'collection' | 'item'; data: MediaCollection | MediaItem }> = [];
    
    collections.forEach(col => {
      displayItems.push({ type: 'collection', data: col });
    });
    
    individualItems.forEach(item => {
      displayItems.push({ type: 'item', data: item });
    });

    return displayItems;
  }, [collections, individualItems]);

  // Paginate
  const totalPages = Math.ceil(allDisplayItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return allDisplayItems.slice(start, end);
  }, [allDisplayItems, currentPage, itemsPerPage]);

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
    <div className="space-y-4">
      {/* Pagination Top */}
      {totalPages > 1 && (
        <MediaPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={allDisplayItems.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Items */}
      <div className="space-y-2">
        {paginatedItems.map((displayItem, index) => (
          displayItem.type === 'collection' ? (
            <MediaCollectionItem
              key={`col-${(displayItem.data as MediaCollection).id}`}
              collection={displayItem.data as MediaCollection}
              isUploaded={isUploaded}
              onToggleUpload={onToggleUpload}
            />
          ) : (
            <MediaListItem
              key={`${(displayItem.data as MediaItem).id}-${index}`}
              media={displayItem.data as MediaItem}
              isUploaded={isUploaded((displayItem.data as MediaItem).id)}
              onToggleUpload={() => onToggleUpload((displayItem.data as MediaItem).id)}
            />
          )
        ))}
      </div>

      {/* Pagination Bottom */}
      {totalPages > 1 && (
        <MediaPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={allDisplayItems.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};