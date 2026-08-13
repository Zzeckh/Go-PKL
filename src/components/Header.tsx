import React, { useEffect, useState } from 'react';
import { Search, Moon, Sun, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onLogout }) => {
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
      <div>
        <h1 className="text-xl font-bold text-black tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-white/60 border border-black/10 rounded-full px-4 py-2 text-xs text-black/60 focus-within:ring-2 focus-within:ring-black/20 transition-all">
          <Search className="w-4 h-4 text-black/40" />
          <input
            type="text"
            placeholder="Search activities..."
            className="bg-transparent focus:outline-none w-40 text-black"
          />
        </div>

        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white/60 border border-black/10 flex items-center justify-center text-black/60 hover:bg-white hover:text-black transition-all shadow-sm"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onLogout}
          className="md:hidden w-10 h-10 rounded-full bg-white/60 border border-black/10 flex items-center justify-center text-black/60 hover:bg-white hover:text-black transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
