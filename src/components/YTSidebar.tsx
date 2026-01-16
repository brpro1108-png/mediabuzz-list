import { Film, Tv, CheckCircle2, XCircle, CircleDashed } from 'lucide-react';
import { Category } from '@/types/media';
import { UploadFilter } from './YTChips';

interface YTSidebarProps {
  isOpen: boolean;
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  uploadedCount: number;
  totalCount: number;
  uploadFilter: UploadFilter;
  onUploadFilterChange: (filter: UploadFilter) => void;
}

export const YTSidebar = ({ 
  isOpen, 
  activeCategory, 
  onCategoryChange,
  uploadedCount,
  totalCount,
  uploadFilter,
  onUploadFilterChange,
}: YTSidebarProps) => {
  const categories = [
    { icon: Film, label: 'Films', id: 'films' as Category },
    { icon: Tv, label: 'Séries', id: 'series' as Category },
  ];

  const libraryItems = [
    { 
      icon: CircleDashed, 
      label: `Tout`, 
      count: totalCount,
      id: null as UploadFilter, 
      colorClass: '' 
    },
    { 
      icon: CheckCircle2, 
      label: `Uploadés`, 
      count: uploadedCount,
      id: 'uploaded' as UploadFilter, 
      colorClass: 'text-uploaded' 
    },
    { 
      icon: XCircle, 
      label: `Non uploadés`, 
      count: totalCount - uploadedCount,
      id: 'not_uploaded' as UploadFilter, 
      colorClass: 'text-destructive' 
    },
  ];

  return (
    <aside className={`yt-sidebar ${!isOpen ? 'yt-sidebar-mini' : ''} transition-all duration-200`}>
      <div className="py-3">
        {/* Categories */}
        {isOpen && <div className="px-4 py-2 text-sm font-medium text-muted-foreground">Catégories</div>}
        <div className="mb-3">
          {categories.map((item) => (
            <div
              key={item.id}
              onClick={() => onCategoryChange(item.id)}
              className={`yt-sidebar-item ${activeCategory === item.id ? 'yt-sidebar-item-active' : ''} ${!isOpen ? 'flex-col gap-1 py-4' : ''}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={`${!isOpen ? 'text-[10px]' : ''}`}>{isOpen ? item.label : item.label.slice(0, 5)}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-3 my-3" />

        {/* Library / Upload status */}
        {isOpen && <div className="px-4 py-2 text-sm font-medium text-muted-foreground">Bibliothèque</div>}
        <div>
          {libraryItems.map((item) => (
            <div
              key={item.id || 'all'}
              onClick={() => onUploadFilterChange(uploadFilter === item.id ? null : item.id)}
              className={`yt-sidebar-item ${uploadFilter === item.id ? 'yt-sidebar-item-active' : ''} ${!isOpen ? 'flex-col gap-1 py-4' : ''}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.colorClass}`} />
              {isOpen ? (
                <div className="flex items-center justify-between flex-1">
                  <span className={item.colorClass}>{item.label}</span>
                  <span className={`text-xs ${item.colorClass || 'text-muted-foreground'}`}>
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className={`text-[10px] ${item.colorClass}`}>{item.count}</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar when sidebar is open */}
        {isOpen && totalCount > 0 && (
          <div className="px-4 mt-4">
            <div className="text-xs text-muted-foreground mb-2 flex justify-between">
              <span>Progression</span>
              <span>{Math.round((uploadedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-uploaded rounded-full transition-all duration-500"
                style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
