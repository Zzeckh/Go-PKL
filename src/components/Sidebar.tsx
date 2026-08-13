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
        { id: 'data-siswa', icon: GraduationCap, label: 'Data Siswa' },
        { id: 'data-pembimbing', icon: Users, label: 'Data Pembimbing' }
      ];
    }
    if (userRole === 'teacher') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'monitoring', icon: Activity, label: 'Monitoring PKL' },
        { id: 'perizinan', icon: FileCheck, label: 'Perizinan' },
        { id: 'rekap', icon: DownloadCloud, label: 'Rekap Nilai' }
      ];
    }
    if (userRole === 'mentor') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'monitoring', icon: Activity, label: 'Monitoring PKL' },
        { id: 'perizinan', icon: FileCheck, label: 'Perizinan' },
        { id: 'rekap', icon: DownloadCloud, label: 'Rekap Nilai' }
      ];
    }
    return [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'logbook', icon: BookOpen, label: 'Logbook PKL' },
      { id: 'maps', icon: MapPin, label: 'Lokasi Maps' },
      { id: 'absensi', icon: Camera, label: 'Absensi' }
    ];
  };

  const menuItems = getMenuItems();
  return (
    <aside className={`${
      collapsed ? 'md:w-20' : 'md:w-64'
    } w-full bg-white/60 backdrop-blur-xl border border-white/80 rounded-[24px] p-4 flex md:flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm shrink-0 z-20 h-full relative`}>

      {/* Top: Logo + Nav */}
      <div className="space-y-6 w-full flex md:flex-col items-center md:items-stretch justify-between">

        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-black flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 border border-black/80">
              Cx
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
              <div className="font-bold text-black text-base leading-tight">Crextio</div>
              <div className="text-xs text-black/60 font-bold uppercase tracking-widest">Portal PKL</div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex md:flex-col gap-2 w-full overflow-x-auto md:overflow-visible custom-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as ActivePage)}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-[16px] text-sm font-bold transition-all duration-200 shrink-0 ${
                activePage === item.id
                  ? 'bg-black text-white shadow-md scale-[1.02]'
                  : 'text-black/70 hover:bg-white/80 hover:text-black'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activePage === item.id ? 'text-white' : ''}`} />
              <span className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'hidden md:block max-w-0 opacity-0' : 'max-w-[160px] opacity-100 hidden md:block'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Footer Area: User Profile & Collapse Toggle */}
      <div className="hidden md:flex flex-col gap-3 border-t border-black/10 pt-4 w-full">
        {/* Profile card — fixed height so it never shifts vertically */}
        <button
          onClick={() => setActivePage('profile')}
          className="flex items-center w-full bg-white/60 p-2 rounded-[16px] border border-white shadow-sm overflow-hidden h-[52px] hover:bg-white/80 transition-colors text-left"
        >
          {/* Avatar always visible */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-8 h-8 rounded-[10px] object-cover shrink-0 shadow-sm"
          />

          {/* Name + role — collapses horizontally */}
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[120px] opacity-100 ml-3'}`}>
            <div className="text-sm font-bold text-black truncate">{userName}</div>
            <div className="text-xs text-black/60 capitalize font-medium">{userRole === 'mentor' ? 'Pembimbing' : userRole === 'teacher' ? 'Guru' : userRole === 'hubin' ? 'Tim Hubin' : 'Siswa PKL'}</div>
          </div>

          {/* Spacer pushes logout to the right only when expanded */}
          <div className="flex-1" />

          {/* Logout — collapses horizontally */}
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[40px] opacity-100'}`}>
            <div
              onClick={(e) => { e.stopPropagation(); onLogout(); }}
              title="Logout"
              className="flex items-center justify-center p-2 rounded-xl text-black/60 hover:bg-black/10 hover:text-black transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 py-2.5 rounded-2xl text-sm font-bold text-black/60 hover:bg-white/80 hover:text-black transition-all duration-200 overflow-hidden"
        >
          <div className="shrink-0 flex items-center justify-center w-5 h-5 ml-4">
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </div>
          <span className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
            Collapse Sidebar
          </span>
        </button>
      </div>
    </aside>
  );
};
