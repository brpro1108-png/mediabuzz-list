import { Play, Pause, Loader2, Lock } from 'lucide-react';
import { ImportStatus } from '@/hooks/useTMDBImport';

interface ImportButtonProps {
  status: ImportStatus;
  onToggle: () => void;
  pagesLoaded: number;
  totalImported?: number;
  disabled?: boolean;
  isLocked?: boolean;
}

export const ImportButton = ({ 
  status, 
  onToggle, 
  pagesLoaded, 
  totalImported = 0,
  disabled = false,
  isLocked = false,
}: ImportButtonProps) => {
  const isRunning = status === 'running';
  
  // If locked by another tab
  if (isLocked) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-not-allowed"
        title="Import en cours dans un autre onglet"
      >
        <Lock className="w-4 h-4" />
        <span>Verrouillé</span>
        <span className="ml-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/30">
          Autre onglet
        </span>
      </div>
    );
  }
  
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 shadow-sm
        ${isRunning 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isRunning ? 'Cliquer pour mettre en pause' : 'Cliquer pour démarrer l\'import'}
    >
      {isRunning ? (
        <>
          <div className="relative">
            <Loader2 className="w-4 h-4 animate-spin" />
            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
          </div>
          <span>Import en cours</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          <span>Import en pause</span>
        </>
      )}
      
      {/* Page counter badge */}
      <span className={`
        ml-1 px-2 py-0.5 rounded text-xs font-bold
        ${isRunning ? 'bg-green-500/30' : 'bg-red-500/30'}
      `}>
        p.{pagesLoaded}
      </span>
    </button>
  );
};
