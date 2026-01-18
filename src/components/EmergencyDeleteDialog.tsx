import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<{ deleted: number; error: string | null }>;
  onComplete: () => void;
  nonUploadedCount: number;
}

export const EmergencyDeleteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onComplete,
  nonUploadedCount,
}: EmergencyDeleteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await onConfirm();
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.deleted} médias non uploadés supprimés`);
        onComplete();
        onOpenChange(false);
        setConfirmText('');
      }
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Bouton Urgence
          </DialogTitle>
          <DialogDescription>
            Action de dernier recours - Cette action est irréversible
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning box */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Attention : Cette action va supprimer tous les médias sans vidéo associée.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>{nonUploadedCount.toLocaleString()}</strong> médias non uploadés seront supprimés définitivement.
                </p>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Objectif :</strong> Garder une base de contenus propre et éviter l'accumulation de médias incomplets.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Note :</strong> Vous pourrez réimporter les médias supprimés via l'import automatique.
            </p>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tapez <span className="text-destructive font-bold">SUPPRIMER</span> pour confirmer
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
              disabled={isDeleting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setConfirmText('');
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== 'SUPPRIMER'}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer tout
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
