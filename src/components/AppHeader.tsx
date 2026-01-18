import { useState } from 'react';
import { RefreshCw, Search, X, Filter, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import { SearchDropdown } from './SearchDropdown';
import { AutoImportDialog } from './AutoImportDialog';
import { EmergencyDeleteDialog } from './EmergencyDeleteDialog';
import { MediaItem, Category } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

interface AppHeaderProps {
  onSearch: (query: string, category: 'movies' | 'series') => Promise<MediaItem[]>;
  onSelectSearchItem: (item: MediaItem) => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalMedia: number;
  uploadedCount: number;
  isUploaded: (id: string) => boolean;
  activeCategory: Category;
  // Normal search mode
  localSearchQuery: string;
  onLocalSearchChange: (query: string) => void;
  searchMode: 'local' | 'tmdb';
  onSearchModeChange: (mode: 'local' | 'tmdb') => void;
  isAutoUpdating?: boolean;
  onEmergencyDelete?: () => Promise<{ deleted: number; error: string | null }>;
}

export const AppHeader = ({ 
  onSearch,
  onSelectSearchItem,
  onRefresh, 
  isLoading,
  totalMedia,
  uploadedCount,
  isUploaded,
  activeCategory,
  localSearchQuery,
  onLocalSearchChange,
  searchMode,
  onSearchModeChange,
  isAutoUpdating,
  onEmergencyDelete,
}: AppHeaderProps) => {
  const [showAutoImport, setShowAutoImport] = useState(false);
  const [showEmergencyDelete, setShowEmergencyDelete] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const progress = totalMedia > 0 ? (uploadedCount / totalMedia) * 100 : 0;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Vous devez être connecté pour synchroniser');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-tmdb`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Synchronisation terminée: ${result.imported} nouveaux médias`);
        onRefresh();
      } else {
        toast.error(result.error || 'Erreur de synchronisation');
      }
    } catch (err) {
      toast.error('Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
    <header className="app-header">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
          <img 
            src={logo} 
            alt="Global Upload" 
            className="w-full h-full object-contain logo-glow"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">GlobalUpload</h1>
          <p className="text-xs text-muted-foreground">Media Manager</p>
        </div>
      </div>

      {/* Search area */}
      <div className="flex-1 max-w-2xl mx-6 flex items-center gap-2">
        {/* Search mode toggle */}
        <div className="flex bg-secondary rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => onSearchModeChange('local')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              searchMode === 'local' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Rechercher dans la liste actuelle"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSearchModeChange('tmdb')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              searchMode === 'tmdb' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Recherche avancée TMDB"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conditional search input */}
        {searchMode === 'local' ? (
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => onLocalSearchChange(e.target.value)}
              placeholder="Filtrer la liste..."
              className="search-input pl-11 pr-10"
            />
            {localSearchQuery && (
              <button
                onClick={() => onLocalSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/20 rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        ) : (
          <SearchDropdown
            onSearch={onSearch}
            onSelectItem={onSelectSearchItem}
            isUploaded={isUploaded}
            activeCategory={activeCategory}
          />
        )}
      </div>

      {/* Progress + Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Auto-update indicator */}
        {isAutoUpdating && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Import...</span>
          </div>
        )}
        
        {/* Stats display */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {uploadedCount.toLocaleString()} / {totalMedia.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {progress.toFixed(1)}% uploadés
            </p>
          </div>
          <div className="w-24">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Import auto button */}
        <button
          onClick={() => setShowAutoImport(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
          title="Import automatique TMDB"
        >
          <Download className="w-4 h-4" />
          Import auto
        </button>

        {/* Emergency button */}
        {onEmergencyDelete && (
          <button
            onClick={() => setShowEmergencyDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-xl transition-colors text-sm font-medium"
            title="Supprimer tous les médias non uploadés"
          >
            <AlertTriangle className="w-4 h-4" />
            Urgence
          </button>
        )}

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-primary/20 rounded-xl transition-colors text-sm"
          title="Synchroniser les nouveaux contenus"
        >
          <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 bg-secondary hover:bg-primary/20 rounded-xl transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>

    <AutoImportDialog
      open={showAutoImport}
      onOpenChange={setShowAutoImport}
      onComplete={onRefresh}
    />

    {onEmergencyDelete && (
      <EmergencyDeleteDialog
        open={showEmergencyDelete}
        onOpenChange={setShowEmergencyDelete}
        onConfirm={onEmergencyDelete}
        onComplete={onRefresh}
        nonUploadedCount={totalMedia - uploadedCount}
      />
    )}
    </>
  );
};
