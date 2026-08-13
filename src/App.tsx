import { useState } from 'react';
import { useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './components/Dashboard';
import { MentorDashboard } from './components/MentorDashboard';
import { Logbook } from './components/Logbook';
import { Maps } from './components/Maps';
import { Profile } from './components/Profile';
import { Absensi } from './components/Absensi';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherMonitoring, TeacherPerizinan, TeacherRekap } from './components/TeacherPages';
import { HubinDashboard } from './components/HubinDashboard';
import { HubinSiswa, HubinPembimbing } from './components/HubinPages';
import { UserRole } from './types';

export default function App() {
  const {
    isAuthenticated,
    authMode,
    setAuthMode,
    userRole,
    setUserRole,
    activePage,
    setActivePage,
    userName,
    schoolName,
    logEntries,
    attendances,
    mapLocations,
    addLogEntry,
    checkInAttendance,
    login,
    register,
    logout
  } = useApp();

  const [authExiting, setAuthExiting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  const handleAuthSubmit = async (payload: { name: string; email: string; password: string; role: UserRole }) => {
    setAuthExiting(true);

    try {
      if (authMode === 'login') {
        await login(payload.email, payload.password);
      } else {
        await register(payload.name, payload.email, payload.password, payload.role);
      }
    } catch (error) {
      console.error('Auth error', error);
    } finally {
      setTimeout(() => {
        setAuthExiting(false);
      }, 430);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
      setActivePage('dashboard');
    }, 420);
  };

  const openLogbookModal = () => {
    setActivePage('logbook');
    setIsJournalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-app-outer p-3 sm:p-6 lg:p-8 flex items-center justify-center font-sans antialiased transition-colors duration-500">
      <div className="w-full max-w-7xl h-[calc(100svh-24px)] sm:h-[85vh] sm:min-h-[600px] sm:max-h-[900px] bg-gradient-to-br from-app-bg-1 via-app-bg-2 to-app-bg-3 rounded-[24px] sm:rounded-[24px] shadow-2xl border border-white/60 relative overflow-hidden flex flex-col transition-colors duration-500">

        {!isAuthenticated ? (
          <div className={`flex-1 flex flex-col p-2 sm:p-4 ${authExiting ? 'page-exit' : 'page-enter'}`}>
            <AuthScreen
              authMode={authMode}
              setAuthMode={setAuthMode}
              userRole={userRole}
              setUserRole={setUserRole}
              onSubmit={handleAuthSubmit}
            />
          </div>
        ) : (
          <div key="main" className={`flex-1 flex flex-col overflow-hidden ${isLoggingOut ? 'page-exit' : 'page-enter'}`}>
            <MainLayout
              activePage={activePage}
              setActivePage={setActivePage}
              onLogout={handleLogout}
              userName={userName}
              userRole={userRole}
            >
              {activePage === 'dashboard' && userRole === 'intern' && (
                <Dashboard 
                  userName="Budi Santoso" 
                  recentLogs={logEntries} 
                  attendances={attendances}
                  onOpenLogbookModal={openLogbookModal}
                  onCheckIn={checkInAttendance}
                  onGoToProfile={() => setActivePage('profile')}
                />
              )}
              {activePage === 'dashboard' && userRole === 'mentor' && (
                <MentorDashboard 
                  userName={userName}
                  companyName="PT Tokopedia"
                />
              )}
              {activePage === 'dashboard' && userRole === 'teacher' && (
                <TeacherDashboard 
                  userName={userName}
                  schoolName={schoolName}
                />
              )}
              {activePage === 'dashboard' && userRole === 'hubin' && (
                <HubinDashboard 
                  userName={userName}
                  schoolName={schoolName}
                  onNavigate={(page) => setActivePage(page)}
                />
              )}
              {activePage === 'logbook' && (
                <Logbook 
                  logs={logEntries} 
                  onAddLog={addLogEntry} 
                  isModalOpen={isJournalModalOpen}
                  setIsModalOpen={setIsJournalModalOpen}
                />
              )}
              {activePage === 'maps' && (
                <Maps locations={mapLocations} attendances={attendances} onCheckIn={checkInAttendance} />
              )}
              {activePage === 'profile' && (
                <Profile userRole={userRole} />
              )}
              {activePage === 'absensi' && userRole === 'intern' && (
                <Absensi 
                  onCheckIn={checkInAttendance}
                  hasCheckedIn={attendances.some(a => a.date === new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))} 
                />
              )}
              {activePage === 'monitoring' && (userRole === 'teacher' || userRole === 'mentor') && (
                <TeacherMonitoring />
              )}
              {activePage === 'perizinan' && (userRole === 'teacher' || userRole === 'mentor') && (
                <TeacherPerizinan />
              )}
              {activePage === 'rekap' && (userRole === 'teacher' || userRole === 'mentor') && (
                <TeacherRekap />
              )}
              {activePage === 'data-siswa' && userRole === 'hubin' && (
                <HubinSiswa />
              )}
              {activePage === 'data-pembimbing' && userRole === 'hubin' && (
                <HubinPembimbing />
              )}
            </MainLayout>
          </div>
        )}

      </div>
    </div>
  );
}
