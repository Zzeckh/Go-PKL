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
        <h1 className="text-xl font-bold text-black tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar - Hidden on mobile, visible on desktop */}
        <div className="hidden md:flex items-center gap-2 bg-white/60 border border-black/10 rounded-full px-4 py-2 text-xs text-black/60 focus-within:ring-2 focus-within:ring-black/20 transition-all w-48 lg:w-64">
          <Search className="w-4 h-4 text-black/40 shrink-0" />
          <input
            type="text"
            placeholder="Search activities..."
            className="bg-transparent focus:outline-none w-full text-black placeholder:text-black/40"
          />
        </div>

        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white/60 border border-black/10 flex items-center justify-center text-black/60 hover:bg-white hover:text-black transition-all shadow-sm"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Mobile Profile Avatar - Acts as entry to Profile/Logout */}
        <button
          onClick={onProfileClick}
          className="md:hidden w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm hover:opacity-90 transition-all"
          aria-label="Profile"
        >
          {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </button>

        {/* Desktop Logout Button */}
        <button
          onClick={onLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-black/10 text-black/60 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};