import React from 'react';
import { LayoutDashboard, BookOpen, MapPin, LogOut, PanelLeftClose, PanelLeftOpen, Camera, Users, Activity, FileCheck, DownloadCloud, GraduationCap } from 'lucide-react';
import { ActivePage, UserRole } from '../types';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  userName: string;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  onLogout,
  userName,
  userRole = 'intern'
}) => {
  const getMenuItems = () => {
    if (userRole === 'hubin') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'pemetaan', icon: MapPin, label: 'Pemetaan' },
        { id: 'data-siswa', icon: GraduationCap, label: 'Siswa' },
        { id: 'data-pembimbing', icon: Users, label: 'Pembimbing' }
      ];
    }
    if (userRole === 'teacher' || userRole === 'mentor') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'monitoring', icon: Activity, label: 'Monitoring' },
        { id: 'perizinan', icon: FileCheck, label: 'Perizinan' },
        { id: 'rekap', icon: DownloadCloud, label: 'Rekap' }
      ];
    }
    return [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
      { id: 'absensi', icon: Camera, label: 'Absensi' },
      { id: 'logbook', icon: BookOpen, label: 'Logbook' },
      { id: 'maps', icon: MapPin, label: 'Maps' }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* ========================================== */}
      {/* MOBILE BOTTOM NAVIGATION                   */}
      {/* ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-black/10 px-2 pb-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-center h-16 sm:h-20">
        {menuItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as ActivePage)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 relative ${
                isActive ? 'text-black' : 'text-black/40'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-black rounded-b-full" />
              )}
              <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] sm:text-xs font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ========================================== */}
      {/* DESKTOP SIDEBAR                            */}
      {/* ========================================== */}
      <aside className={`hidden md:flex ${
        collapsed ? 'md:w-20' : 'md:w-64'
      } bg-white/60 backdrop-blur-xl border border-white/80 rounded-[24px] p-4 flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm shrink-0 z-20 h-full relative`}>

        <div className="space-y-6 w-full flex flex-col items-stretch">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[14px] bg-black flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 border border-black/80">
                Go
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
                <div className="font-bold text-black text-base leading-tight">Go-PKL</div>
                <div className="text-xs text-black/60 font-bold uppercase tracking-widest">Portal PKL</div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex flex-col gap-2 w-full">
            {menuItems.map(item => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as ActivePage)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-black text-white shadow-md scale-[1.02]'
                      : 'text-black/70 hover:bg-white/80 hover:text-black'
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                  <span className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 w-full">
          <button
            onClick={() => setActivePage('profile')}
            className="flex items-center w-full bg-white/60 p-2 rounded-[16px] border border-white shadow-sm overflow-hidden h-[52px] hover:bg-white/80 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-[10px] bg-black text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[120px] opacity-100 ml-3'}`}>
              <div className="text-sm font-bold text-black truncate">{userName || 'User'}</div>
              <div className="text-xs text-black/60 capitalize font-medium">
                {userRole === 'mentor' ? 'Pembimbing' : userRole === 'teacher' ? 'Guru' : userRole === 'hubin' ? 'Tim Hubin' : 'Siswa PKL'}
              </div>
            </div>

            <div className="flex-1" />

            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[40px] opacity-100'}`}>
              <div
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                title="Logout"
                className="flex items-center justify-center p-2 rounded-xl text-black/60 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 py-2.5 rounded-2xl text-sm font-bold text-black/60 hover:bg-white/80 hover:text-black transition-all duration-200 overflow-hidden"
          >
            <div className="shrink-0 flex items-center justify-center w-5 h-5 ml-4">
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </div>
            <span className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};