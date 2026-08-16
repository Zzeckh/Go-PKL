import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ActivePage, AuthMode, UserRole, LogEntry, PKLMapLocation, AttendanceRecord } from '../types';
import { api, setLogoutCallback } from '../utils/api';

export interface SiswaItem {
  id: number;
  name: string;
  kelas: string;
  perusahaan: string;
  guruPembimbing: string;
  mentor: string;
  kehadiran: number;
  logs: number;
  nilaiDUDI: string;
  nilaiGuru: string;
  finalNilai: string;
  berkasPct: number;
  img?: string;
}

export interface PerusahaanItem {
  id: number;
  name: string;
  address: string;
  quota: number;
  filled: number;
  mentor: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface GuruItem {
  id: number;
  name: string;
  subject: string;
  totalSiswa: number;
  totalDUDI: number;
}

export interface MentorItem {
  id: number;
  name: string;
  perusahaan: string;
  role: string;
  totalSiswa: number;
}

export interface PerizinanItem {
  id: number;
  name: string;
  company: string;
  date: string;
  type: 'Sakit' | 'Izin';
  reason: string;
  attachment: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AppContextType {
  isAuthenticated: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  userRole: UserRole;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  userName: string;
  schoolName: string;
  userId: number | null;
  isLoading: boolean;
  loadingResources: Set<string>;
  siswaList: SiswaItem[];
  perusahaanList: PerusahaanItem[];
  guruList: GuruItem[];
  mentorList: MentorItem[];
  logEntries: LogEntry[];
  attendances: AttendanceRecord[];
  perizinanList: PerizinanItem[];
  mapLocations: PKLMapLocation[];
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'date' | 'status'>) => Promise<void>;
  updateLogStatus: (id: string, status: 'approved' | 'rejected', feedback?: string) => Promise<void>;
  checkInAttendance: (imageUrl?: string, latitude?: number, longitude?: number) => Promise<void>;
  updatePerizinanStatus: (id: number, status: 'approved' | 'rejected', rejectReason?: string) => Promise<void>;
  submitEvaluation: (siswaId: number, nilaiDUDI: number, nilaiGuru: number) => Promise<void>;
  addSiswa: (newSiswa: Omit<SiswaItem, 'id' | 'kehadiran' | 'logs' | 'nilaiDUDI' | 'nilaiGuru' | 'finalNilai' | 'berkasPct'>) => Promise<void>;
  addPerusahaan: (newComp: Omit<PerusahaanItem, 'id' | 'filled'>) => Promise<void>;
  updateSiswaMapping: (id: number, patch: { perusahaan?: string; guruPembimbing?: string; mentor?: string }) => Promise<void>;
  updateCompanyLocation: (id: number, latitude: number, longitude: number, radiusMeters: number) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, institution?: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapBackendRoleToUserRole = (role: string): UserRole => {
  switch (role) {
    case 'student': return 'intern';
    case 'teacher': return 'teacher';
    case 'mentor': return 'mentor';
    case 'hubin': return 'hubin';
    default: return 'intern';
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [userRole, setUserRole] = useState<UserRole>('intern');
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pkl_token'));

  const [isLoading, setIsLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState<Set<string>>(new Set());

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [perusahaanList, setPerusahaanList] = useState<PerusahaanItem[]>([]);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [mentorList, setMentorList] = useState<MentorItem[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [perizinanList, setPerizinanList] = useState<PerizinanItem[]>([]);
  const [mapLocations, setMapLocations] = useState<PKLMapLocation[]>([]);

  const startLoading = (resource: string) => {
    setLoadingResources(prev => new Set(prev).add(resource));
  };

  const stopLoading = (resource: string) => {
    setLoadingResources(prev => {
      const next = new Set(prev);
      next.delete(resource);
      return next;
    });
  };

  const logout = useCallback(() => {
    localStorage.removeItem('pkl_token');
    localStorage.removeItem('pkl_role');
    localStorage.removeItem('pkl_user_name');
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    setActivePage('dashboard');
    setUserRole('intern');
    setUserName('');
    setSchoolName('');
    setSiswaList([]);
    setPerusahaanList([]);
    setGuruList([]);
    setMentorList([]);
    setLogEntries([]);
    setAttendances([]);
    setPerizinanList([]);
    setMapLocations([]);
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  const loadLogEntries = async () => {
    try {
      startLoading('logbook');
      const response = await api.get('/api/logbook') as { data: any[] };
      const mapped = response.data.map((item: any): LogEntry => ({
        id: `LOG-${item.id}`,
        date: formatDate(item.date),
        title: item.activityTitle,
        description: item.description,
        hours: item.hours || 8,
        category: item.category || 'PKL Activity',
        status: item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'revision' : 'pending',
        feedback: item.feedback,
      }));
      setLogEntries(mapped);
    } catch (error) {
      console.warn('Gagal mengambil logbook', error);
    } finally {
      stopLoading('logbook');
    }
  };

  const loadAttendances = async () => {
    try {
      startLoading('absensi');
      const absensi = await api.get('/api/absensi') as any[];
      const mapped = absensi.map((item: any): AttendanceRecord => ({
        id: `ATT-${item.id}`,
        date: formatDate(item.date),
        checkInTime: item.checkInTime 
          ? new Date(item.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : '',
        status:
          item.status === 'hadir' ? 'Hadir'
          : item.status === 'izin' ? 'Izin'
          : item.status === 'alpha' ? 'Alpha'
          : 'Sakit',
      }));
      setAttendances(mapped);
    } catch (error) {
      console.warn('Gagal mengambil absensi', error);
    } finally {
      stopLoading('absensi');
    }
  };

  const loadPerusahaan = async () => {
    try {
      startLoading('perusahaan');
      const response = await api.get('/api/companies') as { data: any[] };
      const mapped = response.data.map((c: any): PerusahaanItem => ({
        id: c.id,
        name: c.name,
        address: c.address,
        quota: c.quota,
        filled: c.filled,
        mentor: c.mentor?.name || '',
        latitude: c.latitude,
        longitude: c.longitude,
        radiusMeters: c.radiusMeters,
      }));
      setPerusahaanList(mapped);
      setMapLocations(mapped.map((c: any): PKLMapLocation => ({
        id: `LOC-${c.id}`,
        companyName: c.name,
        address: c.address,
        category: 'Perusahaan',
        internsCount: c.filled,
        mentorName: c.mentor,
        coordinates: { x: c.longitude || 0, y: c.latitude || 0 },
        distance: '-',
        status: 'active' as const,
      })));
    } catch (error) {
      console.warn('Gagal mengambil perusahaan', error);
    } finally {
      stopLoading('perusahaan');
    }
  };

  const loadSiswa = async () => {
    try {
      startLoading('siswa');
      const response = await api.get('/api/users?role=student') as { data: any[] };
      const mapped = response.data.map((u: any): SiswaItem => ({
        id: u.id,
        name: u.name,
        kelas: '-',
        perusahaan: u.company?.name || '-',
        guruPembimbing: u.teacher?.name || '-',
        mentor: '-',
        kehadiran: u._count?.absensis || 0,
        logs: u._count?.logbooks || 0,
        nilaiDUDI: '0',
        nilaiGuru: '0',
        finalNilai: '0',
        berkasPct: 0,
        img: '',
      }));
      setSiswaList(mapped);
    } catch (error) {
      console.warn('Gagal mengambil siswa', error);
    } finally {
      stopLoading('siswa');
    }
  };

  const loadPerizinan = async () => {
    try {
      startLoading('perizinan');
      const response = await api.get('/api/permissions') as { data: any[] };
      const mapped = response.data.map((p: any): PerizinanItem => ({
        id: p.id,
        name: p.user?.name || 'Unknown',
        company: p.user?.company?.name || '-',
        date: formatDate(p.date),
        type: p.type === 'sakit' ? 'Sakit' : 'Izin',
        reason: p.reason,
        attachment: p.attachmentUrl || '',
        status: p.status,
      }));
      setPerizinanList(mapped);
    } catch (error) {
      console.warn('Gagal mengambil perizinan', error);
    } finally {
      stopLoading('perizinan');
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadLogEntries(),
        loadAttendances(),
        loadPerusahaan(),
        loadSiswa(),
        loadPerizinan(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async () => {
    if (!token) return;

    try {
      startLoading('session');
      const user = await api.get('/api/auth/me') as any;
      const mappedRole = mapBackendRoleToUserRole(user.role);
      
      setUserName(user.name);
      setUserRole(mappedRole);
      setUserId(user.id);
      setSchoolName(user.schoolName || '');
      setIsAuthenticated(true);
      
      await refreshData();
    } catch (error) {
      console.error('Session load error', error);
      logout();
    } finally {
      stopLoading('session');
    }
  };

  useEffect(() => {
    if (token) {
      loadSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.post('/api/auth/login', { email, password }) as { token: string; user: any };
      localStorage.setItem('pkl_token', data.token);
      localStorage.setItem('pkl_role', mapBackendRoleToUserRole(data.user.role));
      localStorage.setItem('pkl_user_name', data.user.name);
      setToken(data.token);
    } catch (error: any) {
      throw new Error(error.message || 'Login gagal');
    }
  };

  const register = async (name: string, email: string, password: string, institution?: string) => {
    try {
      const data = await api.post('/api/auth/register', {
        name,
        email,
        password,
        institution,
      }) as { token: string; user: any };
      localStorage.setItem('pkl_token', data.token);
      localStorage.setItem('pkl_role', mapBackendRoleToUserRole(data.user.role));
      localStorage.setItem('pkl_user_name', data.user.name);
      setToken(data.token);
    } catch (error: any) {
      throw new Error(error.message || 'Registrasi gagal');
    }
  };

  const addLogEntry = async (newLog: Omit<LogEntry, 'id' | 'date' | 'status'>) => {
    try {
      const created = await api.post('/api/logbook', {
        activity_title: newLog.title,
        description: newLog.description,
        hours: newLog.hours,
        category: newLog.category,
      }) as any;

      const entry: LogEntry = {
        id: `LOG-${created.id}`,
        date: formatDate(created.date),
        title: created.activityTitle,
        description: created.description,
        hours: created.hours,
        category: created.category,
        status: 'pending',
      };

      setLogEntries(prev => [entry, ...prev]);
      await loadLogEntries();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal membuat logbook');
    }
  };

  const updateLogStatus = async (id: string, status: 'approved' | 'rejected', feedback?: string) => {
    try {
      const logId = parseInt(id.replace('LOG-', ''));
      await api.put(`/api/logbook/${logId}`, {
        status,
        feedback,
      });
      await loadLogEntries();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal update status logbook');
    }
  };

  const checkInAttendance = async (imageUrl?: string, latitude?: number, longitude?: number) => {
    try {
      await api.post('/api/absensi', {
        status: 'hadir',
        location: 'Current Location',
        image_url: imageUrl || '',
        latitude,
        longitude,
      });
      await loadAttendances();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal melakukan absensi');
    }
  };

  const updatePerizinanStatus = async (id: number, status: 'approved' | 'rejected', rejectReason?: string) => {
    try {
      await api.put(`/api/permissions/${id}`, {
        status,
        rejectReason,
      });
      await loadPerizinan();
      await loadAttendances();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal update status perizinan');
    }
  };

  const submitEvaluation = async (siswaId: number, nilaiDUDI: number, nilaiGuru: number) => {
    try {
      await Promise.all([
        api.post('/api/evaluations', {
          studentId: siswaId,
          score: nilaiDUDI,
          type: 'dudi',
        }),
        api.post('/api/evaluations', {
          studentId: siswaId,
          score: nilaiGuru,
          type: 'guru',
        }),
      ]);
      await loadSiswa();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal submit evaluasi');
    }
  };

  const addSiswa = async (newSiswa: Omit<SiswaItem, 'id' | 'kehadiran' | 'logs' | 'nilaiDUDI' | 'nilaiGuru' | 'finalNilai' | 'berkasPct'>) => {
    try {
      await api.post('/api/auth/register', {
        name: newSiswa.name,
        email: `${newSiswa.name.toLowerCase().replace(/\s+/g, '.')}@gopkl.id`,
        password: 'gopkl123',
        institution: schoolName,
      });
      await loadSiswa();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menambah siswa');
    }
  };

  const addPerusahaan = async (newComp: Omit<PerusahaanItem, 'id' | 'filled'>) => {
    try {
      await api.post('/api/companies', {
        name: newComp.name,
        address: newComp.address,
        quota: newComp.quota,
        mentor: newComp.mentor,
      });
      await loadPerusahaan();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menambah perusahaan');
    }
  };

  const updateSiswaMapping = async (
    _id: number,
    _patch: { perusahaan?: string; guruPembimbing?: string; mentor?: string }
  ) => {
    console.warn('updateSiswaMapping not implemented yet');
  };

  const updateCompanyLocation = async (id: number, latitude: number, longitude: number, radiusMeters: number) => {
    try {
      await api.patch(`/api/companies/${id}`, {
        latitude,
        longitude,
        radiusMeters,
      });
      await loadPerusahaan();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal update lokasi perusahaan');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authMode,
        setAuthMode,
        userRole,
        activePage,
        setActivePage,
        userName,
        schoolName,
        userId,
        isLoading,
        loadingResources,
        siswaList,
        perusahaanList,
        guruList,
        mentorList,
        logEntries,
        attendances,
        perizinanList,
        mapLocations,
        addLogEntry,
        updateLogStatus,
        checkInAttendance,
        updatePerizinanStatus,
        submitEvaluation,
        addSiswa,
        addPerusahaan,
        updateSiswaMapping,
        updateCompanyLocation,
        login,
        register,
        logout,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};