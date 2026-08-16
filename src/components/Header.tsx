import React, { useEffect, useState } from 'react';
import { Search, Moon, Sun, LogOut, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  onLogout: () => void;
  userName?: string;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onLogout, userName, onProfileClick }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="flex items-center justify-between gap-4 bg-white/40 backdrop-blur-xl p-4 rounded-[24px] border border-white/80 shadow-sm shrink-0 transition-colors duration-500">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-navy tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-2 bg-white/60 border border-mist rounded-full px-4 py-2 text-xs text-navy/60 focus-within:ring-2 focus-within:ring-steel/50 focus-within:border-steel transition-all w-48 lg:w-64">
          <Search className="w-4 h-4 text-steel shrink-0" />
          <input
            type="text"
            placeholder="Search activities..."
            className="bg-transparent focus:outline-none w-full text-navy placeholder:text-navy/40"
          />
        </div>

        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white/60 border border-mist flex items-center justify-center text-navy/60 hover:bg-mist hover:text-navy transition-all shadow-sm"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onProfileClick}
          className="md:hidden w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shadow-md shadow-steel/40 hover:opacity-90 transition-all"
          aria-label="Profile"
        >
          {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </button>

        <button
          onClick={onLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-mist text-navy/60 hover:bg-navy hover:text-white hover:border-navy transition-all shadow-sm text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};