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
import { HubinPemetaan } from './components/HubinPemetaan';

export default function App() {
  const {
    isAuthenticated,
    authMode,
    setAuthMode,
    userRole,
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

  // Payload disesuaikan dengan AuthScreen.tsx yang baru (tanpa role, ada institution)
  const handleAuthSubmit = async (payload: { name: string; email: string; password: string; institution?: string }) => {
    setAuthExiting(true);

    try {
      if (authMode === 'login') {
        await login(payload.email, payload.password);
      } else {
        // Pastikan fungsi register di AppContext.tsx menerima institution sebagai parameter ke-4
        await register(payload.name, payload.email, payload.password, payload.institution);
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
    // PERUBAHAN LAYOUT: h-dvh untuk full screen di mobile, padding & rounded hanya di sm ke atas
    <div className="h-dvh sm:h-screen bg-app-outer sm:p-6 lg:p-8 flex items-center justify-center font-sans antialiased transition-colors duration-500 overflow-hidden">
      <div className="w-full sm:max-w-7xl h-full sm:h-[85vh] sm:min-h-[600px] sm:max-h-[900px] bg-gradient-to-br from-app-bg-1 via-app-bg-2 to-app-bg-3 sm:rounded-[24px] sm:shadow-2xl sm:border sm:border-white/60 relative overflow-hidden flex flex-col transition-colors duration-500">

        {!isAuthenticated ? (
          <div className={`flex-1 flex flex-col sm:p-4 ${authExiting ? 'page-exit' : 'page-enter'}`}>
            <AuthScreen
              authMode={authMode}
              setAuthMode={setAuthMode}
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
                  userName={userName} // FIX: Menggunakan state userName, bukan "Budi Santoso"
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
              {activePage === 'pemetaan' && userRole === 'hubin' && (
                <HubinPemetaan />
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