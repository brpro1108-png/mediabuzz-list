import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, CheckCircle, Film, Tv, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface ImportState {
  moviesPage: number;
  seriesPage: number;
  moviesTotalPages: number;
  seriesTotalPages: number;
  moviesImported: number;
  seriesImported: number;
  moviesSkipped: number;
  seriesSkipped: number;
  collectionsCount: number;
  currentPhase: 'movies' | 'series';
  isImporting: boolean;
}

export const AutoImportDialog = ({ open, onOpenChange, onComplete }: AutoImportDialogProps) => {
  const { toast } = useToast();
  const [state, setState] = useState<ImportState>({
    moviesPage: 1,
    seriesPage: 1,
    moviesTotalPages: 500,
    seriesTotalPages: 500,
    moviesImported: 0,
    seriesImported: 0,
    moviesSkipped: 0,
    seriesSkipped: 0,
    collectionsCount: 0,
    currentPhase: 'movies',
    isImporting: false,
  });
  
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing import state
  useEffect(() => {
    const loadState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('import_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setState({
          moviesPage: data.movies_page || 1,
          seriesPage: data.series_page || 1,
          moviesTotalPages: data.movies_total_pages || 500,
          seriesTotalPages: data.series_total_pages || 500,
          moviesImported: data.movies_imported || 0,
          seriesImported: data.series_imported || 0,
          moviesSkipped: data.movies_skipped || 0,
          seriesSkipped: data.series_skipped || 0,
          collectionsCount: data.collections_count || 0,
          currentPhase: (data.current_phase as 'movies' | 'series') || 'movies',
          isImporting: data.is_importing || false,
        });
      }
    };

    if (open) {
      loadState();
    }
  }, [open]);

  const importNextPage = useCallback(async () => {
    if (isPaused || isComplete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
        return;
      }

      const phase = state.currentPhase;
      const page = phase === 'movies' ? state.moviesPage : state.seriesPage;

      console.log(`[AutoImport] Fetching ${phase} page ${page}`);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-tmdb?phase=${phase}&page=${page}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!data?.success) {
        console.error('Import error:', data?.error);
        return;
      }

      console.log(`[AutoImport] Result: imported=${data.imported}, skipped=${data.skipped}, nextPage=${data.nextPage}`);

      setState(prev => {
        const newState = { ...prev };
        
        if (data.phase === 'movies') {
          newState.moviesPage = data.nextPage;
          newState.moviesTotalPages = data.totalPages;
          newState.moviesImported = prev.moviesImported + data.imported;
          newState.moviesSkipped = prev.moviesSkipped + data.skipped;
        } else {
          newState.seriesPage = data.nextPage;
          newState.seriesTotalPages = data.totalPages;
          newState.seriesImported = prev.seriesImported + data.imported;
          newState.seriesSkipped = prev.seriesSkipped + data.skipped;
        }
        
        newState.collectionsCount = prev.collectionsCount + data.collectionsAdded;
        newState.currentPhase = data.nextPhase;
        newState.isImporting = !data.isComplete;

        return newState;
      });

      if (data.isComplete) {
        setIsComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        toast({
          title: 'Import terminé !',
          description: `${state.moviesImported + state.seriesImported} médias importés`,
        });
        onComplete();
      }
    } catch (err) {
      console.error('Import error:', err);
    }
  }, [state.currentPhase, state.moviesPage, state.seriesPage, state.moviesImported, state.seriesImported, isPaused, isComplete, toast, onComplete]);

  const startImport = () => {
    setState(prev => ({ ...prev, isImporting: true }));
    setIsPaused(false);
    setIsComplete(false);
    
    // Start import loop - 1 second interval
    intervalRef.current = setInterval(importNextPage, 1000);
    importNextPage(); // First call immediately
  };

  const pauseImport = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeImport = () => {
    setIsPaused(false);
    intervalRef.current = setInterval(importNextPage, 1000);
    importNextPage();
  };

  const resetImport = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Reset state in database
    await supabase
      .from('import_state')
      .upsert({
        user_id: user.id,
        movies_page: 1,
        series_page: 1,
        movies_imported: 0,
        series_imported: 0,
        movies_skipped: 0,
        series_skipped: 0,
        collections_count: 0,
        current_phase: 'movies',
        is_importing: false,
      });

    setState({
      moviesPage: 1,
      seriesPage: 1,
      moviesTotalPages: 500,
      seriesTotalPages: 500,
      moviesImported: 0,
      seriesImported: 0,
      moviesSkipped: 0,
      seriesSkipped: 0,
      collectionsCount: 0,
      currentPhase: 'movies',
      isImporting: false,
    });
    setIsPaused(false);
    setIsComplete(false);

    toast({
      title: 'Import réinitialisé',
      description: 'L\'import repartira de zéro',
    });
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const moviesProgress = (state.moviesPage / state.moviesTotalPages) * 100;
  const seriesProgress = (state.seriesPage / state.seriesTotalPages) * 100;
  const totalImported = state.moviesImported + state.seriesImported;
  const totalSkipped = state.moviesSkipped + state.seriesSkipped;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            Import automatique TMDB
          </DialogTitle>
          <DialogDescription>
            Importez automatiquement tous les films et séries depuis TMDB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status indicator */}
          {isComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-500 font-medium">Import terminé avec succès !</span>
            </div>
          )}

          {/* Progress bars */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Films
                </span>
                <span className="text-muted-foreground">
                  Page {state.moviesPage} / {state.moviesTotalPages}
                </span>
              </div>
              <Progress value={moviesProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{state.moviesImported} importés</span>
                <span>{state.moviesSkipped} ignorés (doublons)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Tv className="w-4 h-4" />
                  Séries
                </span>
                <span className="text-muted-foreground">
                  Page {state.seriesPage} / {state.seriesTotalPages}
                </span>
              </div>
              <Progress value={seriesProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{state.seriesImported} importés</span>
                <span>{state.seriesSkipped} ignorés (doublons)</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalImported}</div>
              <div className="text-xs text-muted-foreground">Importés</div>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">{totalSkipped}</div>
              <div className="text-xs text-muted-foreground">Ignorés</div>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{state.collectionsCount}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <FolderOpen className="w-3 h-3" />
                Collections
              </div>
            </div>
          </div>

          {/* Current phase indicator */}
          {state.isImporting && !isComplete && (
            <div className="text-center text-sm text-muted-foreground">
              Phase actuelle : <span className="font-medium text-foreground">
                {state.currentPhase === 'movies' ? 'Films' : 'Séries'}
              </span> - Page {state.currentPhase === 'movies' ? state.moviesPage : state.seriesPage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!state.isImporting && !isComplete && (
              <Button onClick={startImport} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Démarrer l'import
              </Button>
            )}
            
            {state.isImporting && !isComplete && (
              <>
                {isPaused ? (
                  <Button onClick={resumeImport} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Reprendre
                  </Button>
                ) : (
                  <Button onClick={pauseImport} variant="secondary" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
              </>
            )}

            <Button onClick={resetImport} variant="outline" size="icon" title="Réinitialiser l'import">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
