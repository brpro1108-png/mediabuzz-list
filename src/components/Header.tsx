import logo from '@/assets/logo.png';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-card border border-primary/30 shadow-lg">
            <img 
              src={logo} 
              alt="Global Upload" 
              className="w-10 h-10 object-contain logo-glow"
            />
          </div>
          <div>
            <h1 className="font-bold text-2xl gradient-text tracking-wide">
              GlobalUpload
            </h1>
            <p className="text-sm text-muted-foreground italic">
              Gestionnaire de médias
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};