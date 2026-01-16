import { Menu, Search, Bell, Upload, Mic } from 'lucide-react';

interface YTHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
}

export const YTHeader = ({ searchQuery, onSearchChange, onToggleSidebar }: YTHeaderProps) => {
  return (
    <header className="yt-header">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DW</span>
          </div>
          <span className="text-xl font-semibold hidden sm:block">DarkiWorld</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-2xl mx-4 hidden sm:flex items-center gap-2">
        <div className="yt-search flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher"
            className="yt-search-input"
          />
          <button className="yt-search-btn">
            <Search className="w-5 h-5" />
          </button>
        </div>
        <button className="p-2.5 bg-secondary hover:bg-accent rounded-full transition-colors">
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-accent rounded-full transition-colors sm:hidden">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex">
          <Upload className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center ml-2">
          <span className="text-white text-sm font-medium">U</span>
        </div>
      </div>
    </header>
  );
};
