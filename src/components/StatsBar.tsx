import { Check, Clock } from 'lucide-react';

interface StatsBarProps {
  totalCount: number;
  uploadedCount: number;
}

export const StatsBar = ({ totalCount, uploadedCount }: StatsBarProps) => {
  const percentage = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
  const remainingCount = totalCount - uploadedCount;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Check className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{uploadedCount}</p>
          <p className="text-xs text-muted-foreground">Uploadés</p>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-muted">
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{remainingCount}</p>
          <p className="text-xs text-muted-foreground">Restants</p>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progression</span>
          <span className="text-xs font-medium text-primary">{percentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
