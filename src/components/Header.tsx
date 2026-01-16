import { Clapperboard } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Clapperboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl gradient-text">
              DarkiWorld Tracker
            </h1>
            <p className="text-xs text-muted-foreground">
              Suivi des uploads
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
