import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ActivePage, UserRole } from '../types';

interface MainLayoutProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onLogout: () => void;
  userName: string;
  userRole?: UserRole;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activePage,
  setActivePage,
  onLogout,
  userName,
  userRole = 'intern',
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard';
      case 'logbook':   return 'Logbook PKL';
      case 'absensi':   return 'Absensi Harian';
      case 'maps':      return 'Lokasi & Maps';
      case 'profile':   return 'Profile';
      case 'attendance':return 'Attendance Tracking';
      case 'roster':    return 'Student Roster';
      case 'monitoring':return 'Monitoring PKL';
      case 'perizinan': return 'Verifikasi Perizinan';
      case 'rekap':     return 'Rekapitulasi Nilai';
      default:          return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-3 h-full overflow-hidden p-2">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={onLogout}
        userName={userName}
        userRole={userRole}
      />
      <main className="flex-1 flex flex-col gap-3 overflow-hidden">
        <Header title={getPageTitle()} onLogout={onLogout} />
        <div className="flex-1 overflow-hidden relative">
          <div key={activePage} className="absolute inset-0 section-enter flex flex-col h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
