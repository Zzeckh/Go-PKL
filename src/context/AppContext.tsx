import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ActivePage, AuthMode, UserRole, LogEntry, PKLMapLocation, AttendanceRecord } from '../types';
import { api, setLogoutCallback } from '../utils/api';

export interface SiswaItem {
  id: number;
  name: string;
  kelas: string;
  academicYear: string;
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

export interface PerusahaanItem {
  id: number;
  name: string;
  address: string;
  category?: string;
  quota: number;
  filled: number;
  mentor?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number;
}

export interface ClassItem {
  id: number;
  name: string;
  major: string;
  totalStudents: number;
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
  userCompanyName: string;
  userCompanyAddress: string;
  userCompanyLocation: { lat: number; lng: number; radius: number } | null;
  isLoading: boolean;
  loadingResources: Set<string>;
  siswaList: SiswaItem[];
  guruList: GuruItem[];
  mentorList: MentorItem[];
  perusahaanList: PerusahaanItem[];
  logEntries: LogEntry[];
  attendances: AttendanceRecord[];
  perizinanList: PerizinanItem[];
  mapLocations: PKLMapLocation[];
  superStats: any;
  superClasses: ClassItem[];
  superUsers: any[];
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'date' | 'status'>) => Promise<void>;
  updateLogStatus: (id: string, status: 'approved' | 'rejected' | 'revision', feedback?: string) => Promise<void>;
  checkInAttendance: (imageUrl?: string, latitude?: number, longitude?: number) => Promise<void>;
  updatePerizinanStatus: (id: number, status: 'approved' | 'rejected', rejectReason?: string) => Promise<void>;
  submitEvaluation: (siswaId: number, nilaiDUDI: number, nilaiGuru: number) => Promise<void>;
  addSiswa: (newSiswa: Omit<SiswaItem, 'id' | 'kehadiran' | 'logs' | 'nilaiDUDI' | 'nilaiGuru' | 'finalNilai' | 'berkasPct'>) => Promise<void>;
  addPerusahaan: (data: { name: string; address: string; quota: number; mentor: string }) => Promise<void>;
  updateSiswaMapping: (siswaId: number, data: { perusahaan: string; guruPembimbing: string; mentor: string }) => Promise<void>;
  updateCompanyLocation: (companyId: number, lat: number, lng: number, radius: number) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, institution?: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
  loadSuperStats: () => Promise<boolean>;
  loadSuperClasses: () => Promise<boolean>;
  createClass: (data: { name: string; major?: string }) => Promise<any>;
  deleteClass: (id: number) => Promise<void>;
  loadSuperUsers: (filters?: { role?: string; search?: string }) => Promise<boolean>;
  toggleUser: (id: number) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapBackendRoleToUserRole = (role: string): UserRole => {
  switch (role) {
    case 'student': return 'intern';
    case 'teacher': return 'teacher';
    case 'mentor': return 'mentor';
    case 'hubin': return 'hubin';
    case 'super_admin': return 'super_admin';
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
  const [schoolName, setSchoolName] = useState('SMK Negeri 1 Nusantara');
  const [userCompanyName, setUserCompanyName] = useState('');
  const [userCompanyAddress, setUserCompanyAddress] = useState('');
  const [userCompanyLocation, setUserCompanyLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pkl_token'));

  const [isLoading, setIsLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState<Set<string>>(new Set());

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [mentorList, setMentorList] = useState<MentorItem[]>([]);
  const [perusahaanList, setPerusahaanList] = useState<PerusahaanItem[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [perizinanList, setPerizinanList] = useState<PerizinanItem[]>([]);
  const [mapLocations, setMapLocations] = useState<PKLMapLocation[]>([]);

  const [superStats, setSuperStats] = useState<any>(null);
  const [superClasses, setSuperClasses] = useState<ClassItem[]>([]);
  const [superUsers, setSuperUsers] = useState<any[]>([]);

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
    setSchoolName('SMK Negeri 1 Nusantara');
    setUserCompanyName('');
    setUserCompanyAddress('');
    setUserCompanyLocation(null);
    setSiswaList([]);
    setGuruList([]);
    setMentorList([]);
    setPerusahaanList([]);
    setLogEntries([]);
    setAttendances([]);
    setPerizinanList([]);
    setMapLocations([]);
    setSuperStats(null);
    setSuperClasses([]);
    setSuperUsers([]);
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
    } catch (error: any) {
      console.warn('Gagal mengambil logbook:', error?.message);
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
    } catch (error: any) {
      console.warn('Gagal mengambil absensi:', error?.message);
    } finally {
      stopLoading('absensi');
    }
  };

  const loadSiswa = async () => {
    try {
      startLoading('siswa');
      const response = await api.get('/api/users?role=student') as { data: any[] };
      const mapped = response.data.map((u: any): SiswaItem => ({
        id: u.id,
        name: u.name,
        kelas: u.class?.name || '-',
        academicYear: u.academicYear || '-',
        perusahaan: '-',
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
    } catch (error: any) {
      console.warn('Gagal mengambil siswa:', error?.message);
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
        company: '-',
        date: formatDate(p.date),
        type: p.type === 'sakit' ? 'Sakit' : 'Izin',
        reason: p.reason,
        attachment: p.attachmentUrl || '',
        status: p.status,
      }));
      setPerizinanList(mapped);
    } catch (error: any) {
      console.warn('Gagal mengambil perizinan:', error?.message);
    } finally {
      stopLoading('perizinan');
    }
  };

  const loadPerusahaan = async () => {
    try {
      startLoading('perusahaan');
      const response = await api.get('/api/companies') as { data: any[] };
      const mapped = response.data.map((c: any): PerusahaanItem => ({
        id: c.id,
        name: c.name,
        address: c.address || '-',
        category: c.category || undefined,
        quota: c.quota || 0,
        filled: c.filled || 0,
        mentor: c.mentor?.name || undefined,
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
        radiusMeters: c.radiusMeters || 500,
      }));
      setPerusahaanList(mapped);
    } catch (error: any) {
      console.warn('Gagal mengambil perusahaan:', error?.message);
    } finally {
      stopLoading('perusahaan');
    }
  };

  const loadSuperStats = useCallback(async (): Promise<boolean> => {
    if (!localStorage.getItem('pkl_token')) return false;
    try {
      const res = await api.get('/api/super-admin/stats') as any;
      setSuperStats(res);
      return true;
    } catch (error: any) {
      console.warn('Gagal mengambil super stats:', error?.message);
      return false;
    }
  }, []);

  const loadSuperClasses = useCallback(async (): Promise<boolean> => {
    if (!localStorage.getItem('pkl_token')) return false;
    try {
      const res = await api.get('/api/super-admin/classes') as any[];
      setSuperClasses(res);
      return true;
    } catch (error: any) {
      console.warn('Gagal mengambil daftar kelas:', error?.message);
      return false;
    }
  }, []);

  const createClass = async (data: { name: string; major?: string }) => {
    const res = await api.post('/api/super-admin/classes', data);
    await loadSuperClasses();
    await loadSuperStats();
    return res;
  };

  const deleteClass = async (id: number) => {
    await api.delete(`/api/super-admin/classes/${id}`);
    await loadSuperClasses();
    await loadSuperStats();
  };

  const loadSuperUsers = useCallback(async (filters?: { role?: string; search?: string }): Promise<boolean> => {
    if (!localStorage.getItem('pkl_token')) return false;
    try {
      const params = new URLSearchParams();
      if (filters?.role && filters.role !== 'all') params.set('role', filters.role);
      if (filters?.search) params.set('search', filters.search);
      const res = await api.get(`/api/super-admin/users?${params.toString()}`) as any[];
      setSuperUsers(res);
      return true;
    } catch (error: any) {
      console.warn('Gagal mengambil daftar user:', error?.message);
      return false;
    }
  }, []);

  const toggleUser = async (id: number) => {
    const res = await api.patch(`/api/super-admin/users/${id}/toggle`);
    await loadSuperUsers();
    return res;
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadLogEntries(),
        loadAttendances(),
        loadSiswa(),
        loadPerizinan(),
        loadPerusahaan(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSession = async (overrideToken?: string) => {
    const tokenToUse = overrideToken || token;
    if (!tokenToUse) return;

    try {
      startLoading('session');
      const user = await api.get('/api/auth/me') as any;
      const mappedRole = mapBackendRoleToUserRole(user.role);
      
      setUserName(user.name);
      setUserRole(mappedRole);
      setUserId(user.id);
      setUserCompanyName(user.companyName || '');
      setUserCompanyAddress(user.companyAddress || '');
      setUserCompanyLocation(user.companyLocation || null);
      setIsAuthenticated(true);
      
      if (mappedRole !== 'super_admin') {
        await refreshData();
      }
    } catch (error: any) {
      console.error('Session load error:', error?.message);
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
      
      await new Promise(resolve => setTimeout(resolve, 50));
      setToken(data.token);
    } catch (error: any) {
      throw new Error(error.message || 'Login gagal');
    }
  };

  const register = async (name: string, email: string, password: string, _institution?: string) => {
    try {
      const data = await api.post('/api/auth/register', {
        name,
        email,
        password,
      }) as { token: string; user: any };
      
      localStorage.setItem('pkl_token', data.token);
      localStorage.setItem('pkl_role', mapBackendRoleToUserRole(data.user.role));
      localStorage.setItem('pkl_user_name', data.user.name);
      
      await new Promise(resolve => setTimeout(resolve, 50));
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

  const updateLogStatus = async (id: string, status: 'approved' | 'rejected' | 'revision', feedback?: string) => {
    try {
      const logId = parseInt(id.replace('LOG-', ''));
      await api.put(`/api/logbook/${logId}`, { status, feedback });
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
      await api.put(`/api/permissions/${id}`, { status, rejectReason });
      await loadPerizinan();
      await loadAttendances();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal update status perizinan');
    }
  };

  const submitEvaluation = async (siswaId: number, nilaiDUDI: number, nilaiGuru: number) => {
    try {
      await Promise.all([
        api.post('/api/evaluations', { studentId: siswaId, score: nilaiDUDI, type: 'dudi' }),
        api.post('/api/evaluations', { studentId: siswaId, score: nilaiGuru, type: 'guru' }),
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
      });
      await loadSiswa();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menambah siswa');
    }
  };

  const addPerusahaan = async (data: { name: string; address: string; quota: number; mentor: string }) => {
    try {
      await api.post('/api/companies', {
        name: data.name,
        address: data.address,
        quota: data.quota,
      });
      await loadPerusahaan();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menambah perusahaan');
    }
  };

  const updateSiswaMapping = async (siswaId: number, data: { perusahaan: string; guruPembimbing: string; mentor: string }) => {
    try {
      await api.patch(`/api/users/${siswaId}`, {
        companyName: data.perusahaan,
      });
      await loadSiswa();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal update pemetaan siswa');
    }
  };

  const updateCompanyLocation = async (companyId: number, lat: number, lng: number, radius: number) => {
    try {
      await api.patch(`/api/companies/${companyId}`, {
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
      });
      await loadPerusahaan();
    } catch (error: any) {
      throw new Error(error.message || 'Gagal update lokasi perusahaan');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated, authMode, setAuthMode, userRole, activePage, setActivePage,
        userName, schoolName, userId, userCompanyName, userCompanyAddress, userCompanyLocation,
        isLoading, loadingResources,        siswaList, guruList, mentorList, perusahaanList,
        logEntries, attendances, perizinanList, mapLocations,
        superStats, superClasses, superUsers,
        addLogEntry, updateLogStatus, checkInAttendance, updatePerizinanStatus,
        submitEvaluation, addSiswa, addPerusahaan, updateSiswaMapping, updateCompanyLocation,
        login, register, logout, refreshData,
        loadSuperStats, loadSuperClasses, createClass, deleteClass,
        loadSuperUsers, toggleUser,
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
