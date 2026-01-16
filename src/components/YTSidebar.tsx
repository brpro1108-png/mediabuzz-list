import { Home, Film, Tv, Sparkles, FileText, Clock, CheckCircle2, TrendingUp, History } from 'lucide-react';
import { Category } from '@/types/media';

interface YTSidebarProps {
  isOpen: boolean;
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  uploadedCount: number;
  totalCount: number;
}

export const YTSidebar = ({ 
  isOpen, 
  activeCategory, 
  onCategoryChange,
  uploadedCount,
  totalCount,
}: YTSidebarProps) => {
  const mainItems = [
    { icon: Home, label: 'Accueil', id: 'home' },
    { icon: TrendingUp, label: 'Tendances', id: 'trending' },
  ];

  const categories = [
    { icon: Film, label: 'Films', id: 'films' as Category },
    { icon: Tv, label: 'Séries', id: 'series' as Category },
  ];

  const libraryItems = [
    { icon: History, label: 'Historique', id: 'history' },
    { icon: CheckCircle2, label: `Uploadés (${uploadedCount})`, id: 'uploaded' },
    { icon: Clock, label: `Restants (${totalCount - uploadedCount})`, id: 'remaining' },
  ];

  return (
    <aside className={`yt-sidebar ${!isOpen ? 'yt-sidebar-mini' : ''} transition-all duration-200`}>
      <div className="py-3">
        {/* Main navigation */}
        <div className="mb-3">
          {mainItems.map((item) => (
            <div
              key={item.id}
              className={`yt-sidebar-item ${!isOpen ? 'flex-col gap-1 py-4' : ''}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={`${!isOpen ? 'text-[10px]' : ''}`}>{isOpen ? item.label : item.label.slice(0, 6)}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-3 my-3" />

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

        {/* Library */}
        {isOpen && <div className="px-4 py-2 text-sm font-medium text-muted-foreground">Ma bibliothèque</div>}
        <div>
          {libraryItems.map((item) => (
            <div
              key={item.id}
              className={`yt-sidebar-item ${!isOpen ? 'flex-col gap-1 py-4' : ''}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.id === 'uploaded' ? 'text-uploaded' : ''}`} />
              <span className={`${!isOpen ? 'text-[10px]' : ''} ${item.id === 'uploaded' ? 'text-uploaded' : ''}`}>
                {isOpen ? item.label : item.label.split(' ')[0].slice(0, 5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
