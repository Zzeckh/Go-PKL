import React from 'react';
import { 
  LayoutDashboard, BookOpen, MapPin, LogOut, PanelLeftClose, PanelLeftOpen, 
  Camera, Activity, FileCheck, DownloadCloud, Package,
  School, Users, ShieldCheck, Building2
} from 'lucide-react';
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
    // ── SUPER ADMIN MENU ──
    if (userRole === 'super_admin') {
      return [
        { id: 'dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'super-classes',    icon: School,          label: 'Kelola Kelas' },
        { id: 'super-users',      icon: Users,           label: 'Kelola Pengguna' },
        { id: 'super-companies',  icon: Building2,       label: 'Kelola Perusahaan' },
      ];
    }
    if (userRole === 'hubin') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'data',      icon: Package,         label: 'Kelola Data' },
        { id: 'pemetaan',  icon: MapPin,          label: 'Pemetaan' },
      ];
    }
    if (userRole === 'teacher' || userRole === 'mentor') {
      return [
        { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'monitoring', icon: Activity,        label: 'Monitoring' },
        { id: 'perizinan',  icon: FileCheck,       label: 'Perizinan' },
        { id: 'rekap',      icon: DownloadCloud,   label: 'Rekap' }
      ];
    }
    return [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
      { id: 'absensi',   icon: Camera,          label: 'Absensi' },
      { id: 'logbook',   icon: BookOpen,        label: 'Logbook' },
      { id: 'maps',      icon: MapPin,          label: 'Maps' }
    ];
  };

  const getRoleLabel = (): string => {
    switch (userRole) {
      case 'super_admin': return 'Super Admin';
      case 'hubin':       return 'Tim Hubin';
      case 'teacher':     return 'Guru';
      case 'mentor':      return 'Pembimbing';
      default:            return 'Siswa PKL';
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-mist px-2 pb-2 shadow-[0_-4px_20px_rgba(21,42,66,0.08)] flex justify-around items-center h-16 sm:h-20">
        {menuItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as ActivePage)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 relative ${
                isActive ? 'text-steel' : 'text-navy/40'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-steel rounded-b-full" />
              )}
              <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] sm:text-xs font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`hidden md:flex ${
        collapsed ? 'md:w-20' : 'md:w-64'
      } bg-white/60 backdrop-blur-xl border border-white/80 rounded-[24px] p-4 flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm shrink-0 z-20 h-full relative`}>

        <div className="space-y-6 w-full flex flex-col items-stretch">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 border border-white/20 ${
                userRole === 'super_admin' ? 'bg-steel shadow-steel/40' : 'bg-navy shadow-steel/40'
              }`}>
                {userRole === 'super_admin' ? <ShieldCheck className="w-5 h-5" /> : 'Go'}
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
                <div className="font-bold text-navy text-base leading-tight">Go-PKL</div>
                <div className="text-xs text-steel font-bold uppercase tracking-widest">Portal PKL</div>
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
                      ? 'bg-steel text-white shadow-md shadow-steel/30 scale-[1.02]'
                      : 'text-navy/70 hover:bg-mist/70 hover:text-navy'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="flex flex-col gap-3 border-t border-mist pt-4 w-full">
          <button
            onClick={() => setActivePage('profile')}
            className="flex items-center w-full bg-white/60 p-2 rounded-[16px] border border-white shadow-sm overflow-hidden h-[52px] hover:bg-mist/70 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-steel/30">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[120px] opacity-100 ml-3'}`}>
              <div className="text-sm font-bold text-navy truncate">{userName || 'User'}</div>
              <div className="text-xs text-steel capitalize font-medium">
                {getRoleLabel()}
              </div>
            </div>

            <div className="flex-1" />

            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[40px] opacity-100'}`}>
              <div
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                title="Logout"
                className="flex items-center justify-center p-2 rounded-xl text-navy/60 hover:bg-mist hover:text-navy transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 py-2.5 rounded-2xl text-sm font-bold text-navy/60 hover:bg-mist/70 hover:text-navy transition-all duration-200 overflow-hidden"
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