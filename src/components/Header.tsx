import { Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 shadow-lg shadow-primary/20">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl gradient-text tracking-wide">
              DarkiWorld Tracker
            </h1>
            <p className="text-sm text-muted-foreground font-body italic">
              Chroniques des royaumes médiatiques
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
