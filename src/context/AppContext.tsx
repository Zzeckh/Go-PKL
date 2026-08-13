import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivePage, AuthMode, UserRole, LogEntry, PKLMapLocation, AttendanceRecord } from '../types';

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
  // Auth & Nav State
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  userName: string;
  schoolName: string;

  // Dynamic Lists
  siswaList: SiswaItem[];
  perusahaanList: PerusahaanItem[];
  guruList: GuruItem[];
  mentorList: MentorItem[];
  logEntries: LogEntry[];
  attendances: AttendanceRecord[];
  perizinanList: PerizinanItem[];
  mapLocations: PKLMapLocation[];

  // Dynamic Mutators
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'date' | 'status'>) => void;
  updateLogStatus: (id: string, status: 'approved' | 'revision', feedback?: string) => void;
  checkInAttendance: (imageUrl?: string) => void;
  updatePerizinanStatus: (id: number, status: 'approved' | 'rejected') => void;
  submitEvaluation: (siswaId: number, nilaiDUDI: string, nilaiGuru: string, berkasPct: number) => void;
  addSiswa: (newSiswa: Omit<SiswaItem, 'id' | 'kehadiran' | 'logs' | 'nilaiDUDI' | 'nilaiGuru' | 'finalNilai' | 'berkasPct'>) => void;
  addPerusahaan: (newComp: Omit<PerusahaanItem, 'id' | 'filled'>) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const mapBackendRoleToUserRole = (role: string): UserRole => {
  switch (role) {
    case 'student':
      return 'intern';
    case 'teacher':
      return 'teacher';
    case 'mentor':
      return 'mentor';
    case 'hubin':
      return 'hubin';
    default:
      return 'intern';
  }
};

const mapUserRoleToBackendRole = (role: UserRole) => (role === 'intern' ? 'student' : role);

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
  const [userName, setUserName] = useState('Budi Santoso');
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pkl_token'));

  const schoolName = 'SMK Negeri 1 Jakarta';

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);

  const [perusahaanList, setPerusahaanList] = useState<PerusahaanItem[]>([]);

  const [guruList] = useState<GuruItem[]>([
    { id: 1, name: 'Ahmad Fauzi, M.Kom', subject: 'Produktif RPL', totalSiswa: 15, totalDUDI: 5 },
    { id: 2, name: 'Linda Kusuma, S.T.', subject: 'Produktif TKJ', totalSiswa: 12, totalDUDI: 3 },
    { id: 3, name: 'Bambang Irawan, S.Kom', subject: 'Produktif MM', totalSiswa: 18, totalDUDI: 6 },
    { id: 4, name: 'Dra. Endang Sri', subject: 'Bahasa Inggris Industri', totalSiswa: 20, totalDUDI: 8 },
  ]);

  const [mentorList] = useState<MentorItem[]>([
    { id: 1, name: 'Siti Rahma, S.T.', perusahaan: 'PT Tokopedia', role: 'Sr. Frontend Developer', totalSiswa: 8 },
    { id: 2, name: 'Ahmad Yasin, M.Kom.', perusahaan: 'Gojek Indonesia', role: 'Backend Tech Lead', totalSiswa: 4 },
    { id: 3, name: 'Budi Hartono, S.Kom.', perusahaan: 'Traveloka', role: 'UI/UX Product Designer', totalSiswa: 3 },
    { id: 4, name: 'Rina Kusuma, S.T.', perusahaan: 'Shopee Indonesia', role: 'Mobile Engineer', totalSiswa: 6 },
  ]);

  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: 'LOG-001',
      date: '14 Sep 2024',
      title: 'Slicing UI Dashboard Crextio dengan Tailwind v4',
      description: 'Mengimplementasikan komponen UI responsive, sidebar navigation, dan visual glassmorphism sesuai mockup.',
      hours: 8,
      category: 'Frontend Development',
      status: 'approved',
    },
    {
      id: 'LOG-002',
      date: '13 Sep 2024',
      title: 'Integrasi Authentication & Form Validation',
      description: 'Membuat halaman Login & Register interaktif lengkap dengan penanganan role siswa PKL dan pembimbing.',
      hours: 7.5,
      category: 'Frontend Development',
      status: 'approved',
    },
  ]);

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([
    { id: 'ATT-001', date: '14 Sep 2024', checkInTime: '07:45', status: 'Hadir' },
    { id: 'ATT-002', date: '13 Sep 2024', checkInTime: '07:50', status: 'Hadir' },
  ]);

  const [perizinanList, setPerizinanList] = useState<PerizinanItem[]>([]);

  const [mapLocations, setMapLocations] = useState<PKLMapLocation[]>([]);

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [companies, perizinan, locations, users] = await Promise.all([
          fetchJson('/api/static/companies'),
          fetchJson('/api/static/perizinan'),
          fetchJson('/api/static/locations'),
          fetchJson('/api/users'),
        ]);

        setPerusahaanList(companies.map((c: any) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          quota: c.quota,
          filled: c.filled,
          mentor: c.mentor || '',
        })));

        setPerizinanList(perizinan.map((p: any) => ({
          id: p.id,
          name: p.name,
          company: p.company,
          date: formatDate(p.date),
          type: p.type === 'Sakit' ? 'Sakit' : 'Izin',
          reason: p.reason,
          attachment: p.attachment || '',
          status: p.status || 'pending',
        })));

        setMapLocations(locations.map((l: any) => ({
          id: `LOC-${l.id}`,
          companyName: l.companyName,
          address: l.address,
          category: l.category,
          internsCount: l.internsCount,
          mentorName: l.mentorName,
          coordinates: { x: l.coordX, y: l.coordY },
          distance: l.distance,
          status: l.status,
        })));

        setSiswaList(users
          .filter((u: any) => u.role === 'student')
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            kelas: '-',
            perusahaan: '-',
            guruPembimbing: '-',
            mentor: '-',
            kehadiran: 0,
            logs: 0,
            nilaiDUDI: '0',
            nilaiGuru: '0',
            finalNilai: '0',
            berkasPct: 0,
            img: '',
          })));

      } catch (error) {
        console.warn('Gagal memuat data statis', error);
      }
    };

    loadStaticData();
  }, []);

  const fetchJson = async (path: string, options: RequestInit = {}) => {
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      authHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders,
      ...options,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const loadSession = async () => {
    if (!token) return;

    try {
      const user = await fetchJson('/api/auth/me');
      const mappedRole = mapBackendRoleToUserRole(user.role);
      setUserName(user.name);
      setUserRole(mappedRole);
      setUserId(user.id);
      setIsAuthenticated(true);
      await Promise.all([loadLogEntries(), loadAttendances()]);
    } catch (error) {
      console.error('Session load error', error);
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      loadSession();
    }
  }, [token]);

  const saveSession = (tokenValue: string, user: { id: number; name: string; email: string; role: string }) => {
    localStorage.setItem('pkl_token', tokenValue);
    localStorage.setItem('pkl_role', mapBackendRoleToUserRole(user.role));
    localStorage.setItem('pkl_user_name', user.name);
    setToken(tokenValue);
    setUserId(user.id);
    setUserName(user.name);
    setUserRole(mapBackendRoleToUserRole(user.role));
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('pkl_token');
    localStorage.removeItem('pkl_role');
    localStorage.removeItem('pkl_user_name');
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    setActivePage('dashboard');
    setUserRole('intern');
    setUserName('Budi Santoso');
  };

  const loadAttendances = async () => {
    try {
      const absensi = await fetchJson('/api/absensi');
      const mapped = absensi.map((item: any) => ({
        id: `ATT-${item.id}`,
        date: formatDate(item.date),
        checkInTime: new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: item.status === 'hadir' ? 'Hadir' : item.status === 'izin' ? 'Izin' : 'Sakit',
      }));
      setAttendances(mapped);
    } catch (error) {
      console.warn('Gagal mengambil absensi', error);
    }
  };

  const loadLogEntries = async () => {
    try {
      const logbook = await fetchJson('/api/logbook');
      const mapped = logbook.map((item: any) => ({
        id: `LOG-${item.id}`,
        date: formatDate(item.date),
        title: item.activityTitle,
        description: item.description,
        hours: 8,
        category: 'PKL Activity',
        status: item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'revision' : 'pending',
      }));
      setLogEntries(mapped.reverse());
    } catch (error) {
      console.warn('Gagal mengambil logbook', error);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    await Promise.all([loadLogEntries(), loadAttendances()]);
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const data = await fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role: mapUserRoleToBackendRole(role) }),
    });
    saveSession(data.token, data.user);
    await Promise.all([loadLogEntries(), loadAttendances()]);
  };

  const addLogEntry = async (newLog: Omit<LogEntry, 'id' | 'date' | 'status'>) => {
    if (!userId) return;
    try {
      const created = await fetchJson('/api/logbook', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          date: new Date().toISOString(),
          activity_title: newLog.title,
          description: newLog.description,
          status: 'pending',
        }),
      });

      const entry: LogEntry = {
        id: `LOG-${created.id}`,
        date: formatDate(created.date),
        title: created.activityTitle,
        description: created.description,
        hours: newLog.hours,
        category: newLog.category,
        status: 'pending',
      };

      setLogEntries(prev => [entry, ...prev]);
    } catch (error) {
      console.warn('Gagal membuat logbook', error);
    }
  };

  const checkInAttendance = async (imageUrl?: string) => {
    if (!userId) return;
    try {
      const created = await fetchJson('/api/absensi', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          status: 'hadir',
          location: 'PT Tokopedia Tower',
          image_url: imageUrl || '',
        }),
      });

      const newRecord: AttendanceRecord = {
        id: `ATT-${created.id}`,
        date: formatDate(created.date),
        checkInTime: new Date(created.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: 'Hadir',
      };

      setAttendances(prev => [newRecord, ...prev]);
      setSiswaList(prev => prev.map(s => s.name === userName ? { ...s, kehadiran: Math.min(100, s.kehadiran + 1) } : s));
    } catch (error) {
      console.warn('Gagal melakukan absensi', error);
    }
  };

  const updateLogStatus = (id: string, status: 'approved' | 'revision', feedback?: string) => {
    setLogEntries(prev => prev.map(l => l.id === id ? { ...l, status, feedback } : l));
  };

  const updatePerizinanStatus = (id: number, status: 'approved' | 'rejected') => {
    setPerizinanList(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const submitEvaluation = (siswaId: number, nilaiDUDI: string, nilaiGuru: string, berkasPct: number) => {
    const numDUDI = parseFloat(nilaiDUDI) || 0;
    const numGuru = parseFloat(nilaiGuru) || 0;
    const finalCalc = ((numDUDI + numGuru) / 2).toFixed(1);

    setSiswaList(prev => prev.map(s => s.id === siswaId ? {
      ...s,
      nilaiDUDI,
      nilaiGuru,
      finalNilai: finalCalc,
      berkasPct
    } : s));
  };

  const addSiswa = (newSiswa: Omit<SiswaItem, 'id' | 'kehadiran' | 'logs' | 'nilaiDUDI' | 'nilaiGuru' | 'finalNilai' | 'berkasPct'>) => {
    const item: SiswaItem = {
      ...newSiswa,
      id: siswaList.length + 1,
      kehadiran: 100,
      logs: 0,
      nilaiDUDI: '0',
      nilaiGuru: '0',
      finalNilai: '0',
      berkasPct: 0
    };
    setSiswaList([item, ...siswaList]);

    setPerusahaanList(prev => prev.map(c => c.name.toLowerCase() === newSiswa.perusahaan.toLowerCase() ? { ...c, filled: c.filled + 1 } : c));
  };

  const addPerusahaan = (newComp: Omit<PerusahaanItem, 'id' | 'filled'>) => {
    const item: PerusahaanItem = {
      ...newComp,
      id: perusahaanList.length + 1,
      filled: 0
    };
    setPerusahaanList([...perusahaanList, item]);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        authMode,
        setAuthMode,
        userRole,
        setUserRole,
        activePage,
        setActivePage,
        userName,
        schoolName,

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
        login,
        register,
        logout,
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
