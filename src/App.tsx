import { useEffect, useState } from 'react';

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
import { TeacherMonitoring } from './components/TeacherMonitoring';
import { TeacherKehadiran } from './components/TeacherKehadiran';
import { TeacherPerizinan } from './components/TeacherPerizinan';
import { TeacherPenilaian } from './components/TeacherPenilaian';
import { TeacherMentorMapping } from './components/TeacherMentorMapping';

import { MentorLogbook } from './components/MentorLogbook';
import { MentorKehadiran } from './components/MentorKehadiran';
import { MentorPenilaian } from './components/MentorPenilaian';
import { MentorPerizinan } from './components/MentorPerizinan';

import { HubinDashboard } from './components/HubinDashboard';
import { HubinData } from './components/HubinKelolaData';
import { HubinPemetaan } from './components/HubinPemetaan';
import { HubinManagementDashboard } from './components/HubinManagementDashboard';
import { HubinClasses } from './components/HubinClasses';
import { HubinUsers } from './components/HubinUsers';
import { HubinCompanies } from './components/HubinCompanies';
import { HubinStudentImport } from './components/HubinStudentImport';
import { HubinMentorRoster } from './components/HubinMentorRoster';

import { StudentPerizinan } from './components/StudentPerizinan';
import { Settings } from './components/Settings';
import { Laporan } from './components/Laporan';
import { DataMentor } from './components/DataMentor';

export default function App() {
  const {
    isAuthenticated,
    userRole,
    activePage,
    setActivePage,
    userName,
    schoolName,
    userCompanyName,
    userCompanyAddress,
    userCompanyLocation,
    logEntries,
    attendances,
    dailyStatus,
    addLogEntry,
    checkInAttendance,
    checkOutAttendance,
    login,
    register,
    logout,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authExiting, setAuthExiting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  /*
   * FIX LOGOUT:
   * Ketika kembali ke halaman login,
   * pastikan animasi keluar dari login di-reset.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setAuthExiting(false);
    }
  }, [isAuthenticated]);

  /*
   * LOGIN / REGISTER
   */
  const handleAuthSubmit = async (payload: {
    name: string;
    email: string;
    password: string;
    institution?: string;
    classId?: number;
  }) => {
    if (authMode === 'login') {
      await login(payload.email, payload.password);
    } else {
      await register(
        payload.name,
        payload.email,
        payload.password,
        payload.institution,
        payload.classId
      );
    }

    setAuthExiting(true);
    await new Promise((resolve) => setTimeout(resolve, 430));
  };

  /*
   * LOGOUT
   */
  const handleLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
      setActivePage('dashboard');
    }, 420);
  };

  /*
   * Buka modal tambah logbook
   */
  const openLogbookModal = () => {
    setActivePage('logbook');
    setIsJournalModalOpen(true);
  };

  /*
   * =========================================================
   * AUTH SCREEN
   * =========================================================
   */
  if (!isAuthenticated) {
    return (
      <div className="h-dvh w-full bg-app-outer p-3 sm:p-6 lg:p-8 flex items-center justify-center font-sans antialiased transition-colors duration-500 overflow-hidden">
        <div className="w-full max-w-7xl h-[calc(100svh-24px)] sm:h-[85vh] sm:min-h-[600px] sm:max-h-[900px] bg-app-bg-2 rounded-[24px] shadow-2xl border border-white/60 relative overflow-hidden flex flex-col transition-colors duration-500">
          <div
            className={`flex-1 flex flex-col p-2 sm:p-4 ${
              authExiting ? 'page-exit' : 'page-enter'
            }`}
          >
            <AuthScreen
              authMode={authMode}
              setAuthMode={setAuthMode}
              onSubmit={handleAuthSubmit}
            />
          </div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * MAIN APP
   * =========================================================
   */
  return (
    <div className="h-dvh w-full bg-app-bg-2 font-sans antialiased transition-colors duration-500 overflow-hidden flex flex-col">
      <div
        key="main"
        className={`flex-1 flex flex-col overflow-hidden ${
          isLoggingOut ? 'page-exit' : 'page-enter'
        }`}
      >
        <MainLayout
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={handleLogout}
          userName={userName}
          userRole={userRole}
        >
          {/* =================================================
              STUDENT / INTERN
              ================================================= */}

          {activePage === 'dashboard' && userRole === 'intern' && (
            <Dashboard
              userName={userName}
              recentLogs={logEntries}
              attendances={attendances}
              onOpenLogbookModal={openLogbookModal}
              onCheckIn={checkInAttendance}
              onGoToProfile={() => setActivePage('profile')}
              onNavigate={(page) => setActivePage(page as any)}
            />
          )}

          {/* =================================================
              MENTOR
              ================================================= */}

          {activePage === 'dashboard' && userRole === 'mentor' && (
            <MentorDashboard
              userName={userName}
              companyName={userCompanyName || 'Perusahaan'}
              onNavigate={(page) => setActivePage(page as any)}
            />
          )}

          {/* =================================================
              TEACHER
              ================================================= */}

          {activePage === 'dashboard' && userRole === 'teacher' && (
            <TeacherDashboard
              userName={userName}
              schoolName={schoolName}
              onNavigate={(page) => setActivePage(page as any)}
            />
          )}

          {/* =================================================
              HUBIN
              ================================================= */}

          {activePage === 'dashboard' && userRole === 'hubin' && (
            <HubinDashboard
              userName={userName}
              schoolName={schoolName}
              onNavigate={(page) => setActivePage(page as any)}
            />
          )}

          {/* ── FITUR PENGELOLAAN HUBIN ── */}
          {activePage === 'hubin-summary' && userRole === 'hubin' && (
            <HubinManagementDashboard
              userName={userName}
              onNavigate={(page) => setActivePage(page as any)}
            />
          )}

          {activePage === 'hubin-classes' && userRole === 'hubin' && (
            <HubinClasses />
          )}
          {activePage === 'hubin-users' && userRole === 'hubin' && (
            <HubinUsers />
          )}
          {activePage === 'hubin-student-import' && userRole === 'hubin' && (
            <HubinStudentImport />
          )}
          {activePage === 'hubin-companies' && userRole === 'hubin' && (
            <HubinCompanies />
          )}
          {activePage === 'hubin-mentor-roster' && userRole === 'hubin' && (
            <HubinMentorRoster />
          )}

          {/* =================================================
              LOGBOOK
              ================================================= */}

          {activePage === 'logbook' && userRole === 'mentor' && (
            <MentorLogbook />
          )}

          {activePage === 'logbook' && userRole !== 'mentor' && (
            <Logbook
              logs={logEntries}
              onAddLog={addLogEntry}
              isModalOpen={isJournalModalOpen}
              setIsModalOpen={setIsJournalModalOpen}
              userRole={userRole}
            />
          )}

          {/* =================================================
              MAPS
              ================================================= */}

          {activePage === 'maps' && <Maps />}

          {/* =================================================
              PROFILE
              ================================================= */}

          {activePage === 'profile' && <Profile userRole={userRole} />}

          {/* =================================================
              SETTINGS
              ================================================= */}

          {activePage === 'settings' && <Settings userRole={userRole} />}

          {/* =================================================
              ABSENSI STUDENT
              ================================================= */}

          {activePage === 'absensi' && userRole === 'intern' && (
            <Absensi
              companyName={userCompanyName}
              companyAddress={userCompanyAddress}
              companyLocation={userCompanyLocation}
              onCheckIn={checkInAttendance}
              hasCheckedIn={dailyStatus?.status === 'hadir'}
              onCheckOut={checkOutAttendance}
              hasCheckedOut={!!dailyStatus?.attendance?.checkOutTime}
              checkOutTime={dailyStatus?.attendance?.checkOutTime ?? null}
              permissionBlockStatus={
                dailyStatus?.status === 'izin_pending' ||
                dailyStatus?.status === 'izin_approved'
                  ? dailyStatus.status
                  : null
              }
            />
          )}

          {/* =================================================
              TEACHER MONITORING & MAPPING
              ================================================= */}

          {activePage === 'monitoring' && userRole === 'teacher' && (
            <TeacherMonitoring />
          )}

          {activePage === 'teacher-mentor-mapping' &&
            userRole === 'teacher' && <TeacherMentorMapping />}

          {/* =================================================
              TEACHER / MENTOR ATTENDANCE
              ================================================= */}

          {activePage === 'attendance' && userRole === 'teacher' && (
            <TeacherKehadiran />
          )}

          {activePage === 'attendance' && userRole === 'mentor' && (
            <MentorKehadiran />
          )}

          {/* =================================================
              PENILAIAN / ROSTER
              ================================================= */}

          {activePage === 'roster' && userRole === 'mentor' && (
            <MentorPenilaian />
          )}

          {activePage === 'roster' && userRole === 'teacher' && (
            <TeacherPenilaian />
          )}

          {/* =================================================
              PERIZINAN
              ================================================= */}

          {activePage === 'perizinan' && userRole === 'teacher' && (
            <TeacherPerizinan />
          )}

          {activePage === 'perizinan' && userRole === 'mentor' && (
            <MentorPerizinan />
          )}

          {activePage === 'perizinan' && userRole === 'intern' && (
            <StudentPerizinan />
          )}

          {/* =================================================
              HUBIN PEMETAAN & DATA
              ================================================= */}

          {activePage === 'pemetaan' && userRole === 'hubin' && (
            <HubinPemetaan />
          )}

          {activePage === 'data' && userRole === 'hubin' && <HubinData />}

          {/* =================================================
              LAPORAN
              ================================================= */}

          {activePage === 'laporan' &&
            (userRole === 'hubin' ||
              userRole === 'teacher' ||
              userRole === 'mentor') && <Laporan />}

          {/* =================================================
              DATA MENTOR
              ================================================= */}

          {(activePage as string) === 'data-mentor' && userRole === 'teacher' && (
            <DataMentor />
          )}

          {/* =================================================
              LEGACY FALLBACK
              ================================================= */}

          {activePage === 'data-siswa' && userRole === 'hubin' && (
            <HubinData />
          )}

          {activePage === 'data-pembimbing' && userRole === 'hubin' && (
            <HubinData />
          )}
        </MainLayout>
      </div>
    </div>
  );
}