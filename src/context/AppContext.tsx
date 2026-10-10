import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  ActivePage,
  UserRole,
  LogEntry,
  PKLMapLocation,
  AttendanceRecord,
  AcademicYear,
} from '../types';

import { api, setLogoutCallback } from '../utils/api';

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface SiswaItem {
  id: number;
  name: string;
  kelas: string;
  classId?: number | null;

  academicYearId: number | null;
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

  academicYearId: number | null;
}

export interface MentorItem {
  id: number;
  name: string;
  perusahaan: string;
  role: string;
  totalSiswa: number;

  academicYearId: number | null;
}

export interface PerizinanItem {
  id: number;
  name: string;
  userId?: number;

  company: string;
  date: string;

  type: 'Sakit' | 'Izin';

  reason: string;
  attachment: string;

  status: 'pending' | 'approved' | 'rejected';
}

export interface DailyStatus {
  date: string;

  status:
    | 'belum_ada'
    | 'hadir'
    | 'izin_pending'
    | 'izin_approved'
    | 'izin_rejected';

  canCheckIn: boolean;
  canRequestPermission: boolean;
  canDeletePermission: boolean;

  permissionId?: number | null;

  attendance?: {
    id: number;
    checkInTime?: string | null;
    checkOutTime?: string | null;
  } | null;
}

export interface PerusahaanItem {
  id: number;
  name: string;
  address: string;

  city?: string;
  country?: string;
  category?: string;

  quota: number;
  filled: number;

  mentor?: string;

  latitude?: number | null;
  longitude?: number | null;

  radiusMeters?: number;

  academicYearId: number | null;
}

export interface ClassItem {
  id: number;
  name: string;
  major: string;
  totalStudents: number;
}

/*
 * =========================================================
 * CONTEXT TYPE
 * =========================================================
 */

interface AppContextType {
  isAuthenticated: boolean;

  userRole: UserRole;

  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;

  userName: string;
  schoolName: string;
  userId: number | null;

  userCompanyName: string;
  userCompanyAddress: string;

  userCompanyLocation: {
    lat: number;
    lng: number;
    radius: number;
  } | null;

  isLoading: boolean;
  loadingResources: Set<string>;

  siswaList: SiswaItem[];
  guruList: GuruItem[];
  mentorList: MentorItem[];
  perusahaanList: PerusahaanItem[];

  logEntries: LogEntry[];
  attendances: AttendanceRecord[];
  perizinanList: PerizinanItem[];
  dailyStatus: DailyStatus | null;

  academicYears: AcademicYear[];

  selectedAcademicYearId: number | null;
  setSelectedAcademicYearId: (id: number | null) => void;

  mapLocations: PKLMapLocation[];

  superStats: any;
  superClasses: ClassItem[];
  superUsers: any[];

  addLogEntry: (
    entry: Omit<LogEntry, 'id' | 'date' | 'status'>
  ) => Promise<void>;

  updateLogStatus: (
    id: string,
    status: 'approved' | 'rejected' | 'revision',
    feedback?: string
  ) => Promise<void>;

  updateLogEntry: (
    id: string,
    data: {
      title: string;
      description: string;
      hours: number;
      category: string;
    }
  ) => Promise<void>;

  checkInAttendance: (
    imageUrl?: string,
    latitude?: number,
    longitude?: number
  ) => Promise<void>;

  checkOutAttendance: (
    latitude?: number,
    longitude?: number
  ) => Promise<void>;

  updatePerizinanStatus: (
    id: number,
    status: 'approved' | 'rejected',
    rejectReason?: string
  ) => Promise<void>;

  createPermission: (data: {
    type: string;
    reason: string;
    date: string;
    file?: File | null;
    attachmentUrl?: string;
  }) => Promise<any>;

  deletePermission: (id: number) => Promise<void>;

  createAcademicYear: (name: string) => Promise<void>;

  updateAcademicYear: (
    id: number,
    data: {
      name?: string;
      isActive?: boolean;
    }
  ) => Promise<void>;

  deleteAcademicYear: (id: number) => Promise<void>;

  submitEvaluation: (
    siswaId: number,
    nilaiDUDI: number,
    period: string
  ) => Promise<void>;

  submitGuruGrade: (
    siswaId: number,
    nilaiGuru: number,
    period: string
  ) => Promise<void>;

  addSiswa: (
    newSiswa: Omit<
      SiswaItem,
      | 'id'
      | 'kehadiran'
      | 'logs'
      | 'nilaiDUDI'
      | 'nilaiGuru'
      | 'finalNilai'
      | 'berkasPct'
    >
  ) => Promise<void>;

  addPerusahaan: (data: {
    name: string;
    address: string;
    quota: number;
    mentor: string;

    city?: string;
    country?: string;
    category?: string;

    latitude?: number;
    longitude?: number;
    radiusMeters?: number;

    mentorId?: number;
  }) => Promise<void>;

  updateSiswaMapping: (
    siswaId: number,
    data: {
      perusahaan: string;
      guruPembimbing: string;
      mentor: string;

      companyId?: number | string;
      teacherId?: number | string;
      mentorName?: string;

      academicYear?: string;
    }
  ) => Promise<void>;

  updateCompanyLocation: (
    companyId: number,
    lat: number,
    lng: number,
    radius: number
  ) => Promise<void>;

  login: (email: string, password: string) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string,
    institution?: string,
    classId?: number
  ) => Promise<void>;

  logout: () => void;

  refreshData: () => Promise<void>;

  /*
   * Loader data (dipakai komponen untuk reload manual)
   */
  loadSiswa: (yearId?: number | null) => Promise<void>;
  loadGuru: (yearId?: number | null) => Promise<void>;
  loadMentor: (yearId?: number | null) => Promise<void>;
  loadPerusahaan: (yearId?: number | null) => Promise<boolean>;

  loadSuperStats: (yearId?: number | null) => Promise<boolean>;

  loadHubinClasses: (yearId?: number | null) => Promise<boolean>;

  createClass: (data: {
    name: string;
    major?: string;
  }) => Promise<any>;

  deleteClass: (id: number) => Promise<void>;

  loadClassStudents: (id: number) => Promise<any>;

  loadHubinUsers: (
    filters?: {
      role?: string;
      search?: string;
    },
    yearId?: number | null
  ) => Promise<boolean>;

  toggleUser: (id: number) => Promise<any>;

  deleteUser: (id: number) => Promise<any>;

  updateUserRole: (id: number, role: string) => Promise<any>;

  resetPassword: (id: number) => Promise<{
    id: number;
    name: string;
    newPassword: string;
  }>;

  loadCompanies: (yearId?: number | null) => Promise<boolean>;

  addCompany: (
    data: Partial<PerusahaanItem> & {
      mentorId?: number;
    }
  ) => Promise<any>;

  updateCompany: (
    id: number,
    data: Partial<PerusahaanItem>
  ) => Promise<any>;

  deleteCompany: (id: number) => Promise<any>;

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;

  deleteAccount: (password: string) => Promise<void>;
}

/*
 * =========================================================
 * CONTEXT
 * =========================================================
 */

const AppContext = createContext<AppContextType | undefined>(
  undefined
);

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

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

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getArrayResponse = <T,>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/*
 * =========================================================
 * PROVIDER
 * =========================================================
 */

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  /*
   * -------------------------------------------------------
   * AUTH
   * -------------------------------------------------------
   */

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [userRole, setUserRole] = useState<UserRole>('intern');

  const [activePage, setActivePage] =
    useState<ActivePage>('dashboard');

  const [userName, setUserName] = useState('');

  const [userId, setUserId] = useState<number | null>(null);

  const [schoolName, setSchoolName] = useState(
    'SMK Negeri 1 Nusantara'
  );

  const [userCompanyName, setUserCompanyName] = useState('');

  const [userCompanyAddress, setUserCompanyAddress] =
    useState('');

  const [userCompanyLocation, setUserCompanyLocation] = useState<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('pkl_token')
  );

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  const [isLoading, setIsLoading] = useState(false);

  const [loadingResources, setLoadingResources] = useState<
    Set<string>
  >(new Set());

  const startLoading = useCallback((resource: string) => {
    setLoadingResources((prev) => {
      const next = new Set(prev);
      next.add(resource);
      return next;
    });
  }, []);

  const stopLoading = useCallback((resource: string) => {
    setLoadingResources((prev) => {
      const next = new Set(prev);
      next.delete(resource);
      return next;
    });
  }, []);

  /*
   * -------------------------------------------------------
   * DATA
   * -------------------------------------------------------
   */

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);

  const [guruList, setGuruList] = useState<GuruItem[]>([]);

  const [mentorList, setMentorList] = useState<MentorItem[]>([]);

  const [perusahaanList, setPerusahaanList] = useState<
    PerusahaanItem[]
  >([]);

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const [attendances, setAttendances] = useState<
    AttendanceRecord[]
  >([]);

  const [perizinanList, setPerizinanList] = useState<
    PerizinanItem[]
  >([]);

  const [dailyStatus, setDailyStatus] =
    useState<DailyStatus | null>(null);

  const [academicYears, setAcademicYears] = useState<
    AcademicYear[]
  >([]);

  const [mapLocations, setMapLocations] = useState<
    PKLMapLocation[]
  >([]);

  const [superStats, setSuperStats] = useState<any>(null);

  const [superClasses, setSuperClasses] = useState<ClassItem[]>(
    []
  );

  const [superUsers, setSuperUsers] = useState<any[]>([]);

  /*
   * -------------------------------------------------------
   * SELECTED ACADEMIC YEAR
   * -------------------------------------------------------
   */

  const [
    selectedAcademicYearId,
    setSelectedAcademicYearIdState,
  ] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedAcademicYearId');

    if (!saved) {
      return null;
    }

    const parsed = Number(saved);

    return Number.isNaN(parsed) ? null : parsed;
  });

  const setSelectedAcademicYearId = useCallback(
    (id: number | null) => {
      setSelectedAcademicYearIdState(id);

      if (id === null) {
        localStorage.removeItem('selectedAcademicYearId');
      } else {
        localStorage.setItem('selectedAcademicYearId', String(id));
      }
    },
    []
  );

  /*
   * Saat refreshData/loadSession sedang melakukan reload
   * berdasarkan year, effect tidak perlu melakukan request
   * kedua kali.
   */
  const skipAcademicYearEffect = useRef(false);

  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   */

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
    setDailyStatus(null);

    setAcademicYears([]);
    setMapLocations([]);

    setSuperStats(null);
    setSuperClasses([]);
    setSuperUsers([]);

    setSelectedAcademicYearIdState(null);

    localStorage.removeItem('selectedAcademicYearId');
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  /*
   * =======================================================
   * LOGBOOK
   * =======================================================
   */

  const loadLogEntries = useCallback(async () => {
    try {
      startLoading('logbook');

      const response = await api.get('/api/logbook');

      const items = getArrayResponse<any>(response);

      const mapped = items.map(
        (item: any): LogEntry => ({
          id: `LOG-${item.id}`,

          date: formatDate(item.date),

          title: item.activityTitle,

          description: item.description,

          hours: item.hours || 8,

          category: item.category || 'PKL Activity',

          status:
            item.status === 'approved'
              ? 'approved'
              : item.status === 'rejected'
              ? 'revision'
              : 'pending',

          feedback: item.feedback,

          userId: item.user?.id,

          userName: item.user?.name,

          userClass: item.user?.class?.name,
        })
      );

      setLogEntries(mapped);
    } catch (error: any) {
      console.warn('Gagal mengambil logbook:', error?.message);
    } finally {
      stopLoading('logbook');
    }
  }, [startLoading, stopLoading]);

  /*
   * =======================================================
   * ATTENDANCES
   * =======================================================
   */

  const loadAttendances = useCallback(async () => {
    try {
      startLoading('absensi');

      const response = await api.get('/api/absensi');

      const absensi = getArrayResponse<any>(response);

      const mapped = absensi.map(
        (item: any): AttendanceRecord => ({
          id: `ATT-${item.id}`,

          date: formatDate(item.date),

          checkInTime: item.checkInTime
            ? new Date(item.checkInTime).toLocaleTimeString(
                'id-ID',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )
            : '',

          checkOutTime: item.checkOutTime
            ? new Date(item.checkOutTime).toLocaleTimeString(
                'id-ID',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )
            : '',

          status:
            item.status === 'hadir'
              ? 'Hadir'
              : item.status === 'izin'
              ? 'Izin'
              : item.status === 'alpha'
              ? 'Alpha'
              : 'Sakit',

          userId: item.user?.id ?? item.userId,
        })
      );

      setAttendances(mapped);
    } catch (error: any) {
      console.warn('Gagal mengambil absensi:', error?.message);
    } finally {
      stopLoading('absensi');
    }
  }, [startLoading, stopLoading]);

  /*
   * =======================================================
   * SISWA
   * =======================================================
   */

  const loadSiswa = useCallback(
    async (yearId: number | null = selectedAcademicYearId) => {
      try {
        startLoading('siswa');

        const params = new URLSearchParams();

        params.set('role', 'student');

        if (yearId !== null) {
          params.set('academicYearId', String(yearId));
        }

        const response = await api.get(
          `/api/users?${params.toString()}`
        );

        const users = getArrayResponse<any>(response);

        const mapped = users.map((u: any): SiswaItem => {
          const evals = u.evalAsStudent || [];

          const dudiEval = evals.find((e: any) => e.type === 'dudi');

          const guruEval = evals.find((e: any) => e.type === 'guru');

          const d = Number(dudiEval?.score) || 0;

          const g = Number(guruEval?.score) || 0;

          const nilaiDUDI = dudiEval ? String(dudiEval.score) : '0';

          const nilaiGuru = guruEval ? String(guruEval.score) : '0';

          const finalNilai =
            d > 0 && g > 0
              ? String(Math.round((d + g) / 2))
              : String(g || d || 0);

          return {
            id: u.id,

            name: u.name,

            kelas: u.class?.name || '-',

            classId: u.class?.id ?? u.classId ?? null,

            academicYearId:
              u.academicYearId ?? u.academicYearRef?.id ?? null,

            academicYear:
              u.academicYear || u.academicYearRef?.name || '-',

            perusahaan: u.company?.name || '-',

            guruPembimbing: u.teacher?.name || '-',

            mentor: u.company?.mentor?.name || '-',

            kehadiran: u._count?.absensis ?? 0,

            logs: u._count?.logbooks ?? 0,

            nilaiDUDI,
            nilaiGuru,
            finalNilai,

            berkasPct: 0,

            img: u.avatar || u.image || '',
          };
        });

        setSiswaList(mapped);
      } catch (error: any) {
        console.warn('Gagal mengambil siswa:', error?.message);
      } finally {
        stopLoading('siswa');
      }
    },
    [selectedAcademicYearId, startLoading, stopLoading]
  );

  /*
   * =======================================================
   * GURU
   * =======================================================
   */

  const loadGuru = useCallback(
    async (yearId: number | null = selectedAcademicYearId) => {
      try {
        startLoading('guru');

        const params = new URLSearchParams();

        params.set('role', 'teacher');

        if (yearId !== null) {
          params.set('academicYearId', String(yearId));
        }

        const response = await api.get(
          `/api/users?${params.toString()}`
        );

        const users = getArrayResponse<any>(response);

        const mapped = users.map(
          (u: any): GuruItem => ({
            id: u.id,

            name: u.name,

            subject: u.subject || 'Guru Pembimbing',

            totalSiswa: u._count?.students ?? 0,

            totalDUDI: u._count?.companies ?? 0,

            academicYearId:
              u.academicYearId ??
              u.academicYearRef?.id ??
              yearId ??
              null,
          })
        );

        setGuruList(mapped);
      } catch (error: any) {
        console.warn('Gagal mengambil guru:', error?.message);
      } finally {
        stopLoading('guru');
      }
    },
    [selectedAcademicYearId, startLoading, stopLoading]
  );

  /*
   * =======================================================
   * MENTOR
   * =======================================================
   */

  const loadMentor = useCallback(
    async (yearId: number | null = selectedAcademicYearId) => {
      try {
        startLoading('mentor');

        const mentorParams = new URLSearchParams();

        mentorParams.set('role', 'mentor');

        if (yearId !== null) {
          mentorParams.set('academicYearId', String(yearId));
        }

        const mentorResponse = await api.get(
          `/api/users?${mentorParams.toString()}`
        );

        const mentors = getArrayResponse<any>(mentorResponse);

        /*
         * Fallback untuk backend lama.
         */
        let students: any[] = [];

        try {
          const studentParams = new URLSearchParams();

          studentParams.set('role', 'student');

          if (yearId !== null) {
            studentParams.set('academicYearId', String(yearId));
          }

          const studentResponse = await api.get(
            `/api/users?${studentParams.toString()}`
          );

          students = getArrayResponse<any>(studentResponse);
        } catch {
          students = [];
        }

        const mapped = mentors.map((u: any): MentorItem => {
          const mentoredCompanies = Array.isArray(
            u.mentoredCompanies
          )
            ? u.mentoredCompanies
            : [];

          let perusahaanNames: string[] = mentoredCompanies
            .map((company: any) => company?.name)
            .filter(Boolean);

          const hasCompanyStudentCount = mentoredCompanies.some(
            (company: any) => company?._count?.students !== undefined
          );

          let totalSiswa = 0;

          if (hasCompanyStudentCount) {
            totalSiswa = mentoredCompanies.reduce(
              (total: number, company: any) =>
                total + Number(company?._count?.students || 0),
              0
            );
          } else {
            const studentsOfMentor = students.filter(
              (student: any) => student?.company?.mentor?.id === u.id
            );

            totalSiswa = studentsOfMentor.length;

            if (perusahaanNames.length === 0) {
              perusahaanNames = studentsOfMentor
                .map((student: any) => student?.company?.name)
                .filter(Boolean);
            }
          }

          perusahaanNames = Array.from(new Set(perusahaanNames));

          return {
            id: u.id,

            name: u.name,

            perusahaan:
              u.company?.name || perusahaanNames.join(', ') || '-',

            role:
              u.role === 'mentor' ? 'Mentor' : u.role || 'Mentor',

            totalSiswa,

            academicYearId:
              u.academicYearId ??
              u.academicYearRef?.id ??
              yearId ??
              null,
          };
        });

        setMentorList(mapped);
      } catch (error: any) {
        console.warn('Gagal mengambil mentor:', error?.message);
      } finally {
        stopLoading('mentor');
      }
    },
    [selectedAcademicYearId, startLoading, stopLoading]
  );

  /*
   * =======================================================
   * PERIZINAN
   * =======================================================
   */

  const loadPerizinan = useCallback(async () => {
    try {
      startLoading('perizinan');

      const response = await api.get('/api/permissions');

      const permissions = getArrayResponse<any>(response);

      const mapped = permissions.map((p: any): PerizinanItem => {
        const status =
          p.status === 'approved' ||
          p.status === 'rejected' ||
          p.status === 'pending'
            ? p.status
            : 'pending';

        return {
          id: p.id,

          name: p.user?.name || 'Unknown',

          userId: p.user?.id ?? p.userId,

          company: p.user?.company?.name || '-',

          date: formatDate(p.date),

          type: p.type === 'sakit' ? 'Sakit' : 'Izin',

          reason: p.reason || '',

          attachment: p.attachmentUrl || '',

          status,
        };
      });

      setPerizinanList(mapped);
    } catch (error: any) {
      console.warn('Gagal mengambil perizinan:', error?.message);
    } finally {
      stopLoading('perizinan');
    }
  }, [startLoading, stopLoading]);

  /*
   * =======================================================
   * DAILY STATUS
   * =======================================================
   */

  const loadDailyStatus = useCallback(async () => {
    try {
      startLoading('dailyStatus');

      const res = (await api.get('/api/absensi/status')) as any;

      setDailyStatus({
        date: res.date,

        status: res.status,

        canCheckIn: !!res.canCheckIn,

        canRequestPermission: !!res.canRequestPermission,

        canDeletePermission: !!res.canDeletePermission,

        permissionId: res.permission?.id ?? null,

        attendance: res.attendance
          ? {
              id: res.attendance.id,

              checkInTime: res.attendance.checkInTime ?? null,

              checkOutTime: res.attendance.checkOutTime ?? null,
            }
          : null,
      });
    } catch (error: any) {
      console.warn(
        'Gagal mengambil status harian:',
        error?.message
      );
    } finally {
      stopLoading('dailyStatus');
    }
  }, [startLoading, stopLoading]);

  /*
   * =======================================================
   * ACADEMIC YEARS
   * =======================================================
   */

  const loadAcademicYears = useCallback(async (): Promise<
    number | null
  > => {
    try {
      startLoading('academicYears');

      const response = await api.get('/api/academic-years');

      const years = getArrayResponse<AcademicYear>(response);

      setAcademicYears(years);

      const savedId = localStorage.getItem('selectedAcademicYearId');

      /*
       * 1. Gunakan saved year jika masih tersedia.
       */
      if (savedId) {
        const parsedId = Number(savedId);

        const exists = years.some((year) => year.id === parsedId);

        if (exists) {
          setSelectedAcademicYearIdState(parsedId);

          return parsedId;
        }

        localStorage.removeItem('selectedAcademicYearId');
      }

      /*
       * 2. Jika tidak ada saved year, gunakan tahun aktif.
       */
      const activeYear = years.find((year) => year.isActive);

      if (activeYear) {
        setSelectedAcademicYearIdState(activeYear.id);

        localStorage.setItem(
          'selectedAcademicYearId',
          String(activeYear.id)
        );

        return activeYear.id;
      }

      /*
       * 3. Tidak ada tahun aktif.
       */
      setSelectedAcademicYearIdState(null);

      return null;
    } catch (error: any) {
      console.warn(
        'Gagal mengambil Tahun Ajaran:',
        error?.message
      );

      return selectedAcademicYearId;
    } finally {
      stopLoading('academicYears');
    }
  }, [selectedAcademicYearId, startLoading, stopLoading]);

  /*
   * =======================================================
   * COMPANIES
   * =======================================================
   */

  const loadCompanies = useCallback(
    async (
      yearId: number | null = selectedAcademicYearId
    ): Promise<boolean> => {
      if (!localStorage.getItem('pkl_token')) {
        return false;
      }

      try {
        startLoading('perusahaan');

        const params = new URLSearchParams();

        if (yearId !== null) {
          params.set('academicYearId', String(yearId));
        }

        const query = params.toString();

        const response = await api.get(
          `/api/companies${query ? `?${query}` : ''}`
        );

        const companies = getArrayResponse<any>(response);

        const mapped = companies.map(
          (c: any): PerusahaanItem => ({
            id: c.id,

            name: c.name,

            address: c.address || '-',

            city: c.city || undefined,

            country: c.country || undefined,

            category: c.category || undefined,

            quota: Number(c.quota) || 0,

            filled: Number(c.filled) || 0,

            mentor: c.mentor?.name || undefined,

            latitude: c.latitude ?? null,

            longitude: c.longitude ?? null,

            radiusMeters: Number(c.radiusMeters) || 500,

            academicYearId:
              c.academicYearId ??
              c.academicYearRef?.id ??
              yearId ??
              null,
          })
        );

        setPerusahaanList(mapped);

        /*
         * Data lokasi untuk map.
         * Dibentuk sesuai interface PKLMapLocation.
         */
        const locations: PKLMapLocation[] = companies
          .filter(
            (c: any) =>
              c.latitude !== null &&
              c.latitude !== undefined &&
              c.longitude !== null &&
              c.longitude !== undefined
          )
          .map(
            (c: any): PKLMapLocation => ({
              id: String(c.id),

              companyName: c.name,

              address: c.address || '-',

              category: c.category || '-',

              internsCount: Number(c.filled) || 0,

              mentorName: c.mentor?.name || '-',

              coordinates: {
                x: Number(c.longitude),
                y: Number(c.latitude),
              },

              distance: '-',

              status: 'geofenced',
            })
          );

        setMapLocations(locations);

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil perusahaan:',
          error?.message
        );

        return false;
      } finally {
        stopLoading('perusahaan');
      }
    },
    [selectedAcademicYearId, startLoading, stopLoading]
  );

  /*
   * =======================================================
   * RINGKASAN HUBIN
   * =======================================================
   */

  const loadSuperStats = useCallback(
    async (
      yearId: number | null = selectedAcademicYearId
    ): Promise<boolean> => {
      if (!localStorage.getItem('pkl_token')) {
        return false;
      }

      try {
        const params = new URLSearchParams();

        if (yearId !== null) {
          params.set('academicYearId', String(yearId));
        }

        const query = params.toString();

        const res = await api.get(
          `/api/hubin/stats${query ? `?${query}` : ''}`
        );

        setSuperStats(res);

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil ringkasan hubin:',
          error?.message
        );

        return false;
      }
    },
    [selectedAcademicYearId]
  );

  /*
   * =======================================================
   * KELOLA KELAS HUBIN
   * =======================================================
   */

  const loadHubinClasses = useCallback(
    async (
      yearId: number | null = selectedAcademicYearId
    ): Promise<boolean> => {
      if (!localStorage.getItem('pkl_token')) {
        return false;
      }

      try {
        const params = new URLSearchParams();

        // null berarti semua tahun ajaran,
        // sehingga parameter tahun tidak dikirim.
        if (yearId !== null) {
          params.set('academicYearId', String(yearId));
        }

        const query = params.toString();

        const response = await api.get(
          `/api/hubin/classes${query ? `?${query}` : ''}`
        );

        const classes = getArrayResponse<ClassItem>(response);

        setSuperClasses(classes);

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil daftar kelas:',
          error?.message
        );

        return false;
      }
    },
    [selectedAcademicYearId]
  );

  /*
   * =======================================================
   * CREATE CLASS
   * =======================================================
   */

  const createClass = async (data: {
    name: string;
    major?: string;
  }) => {
    if (selectedAcademicYearId === null) {
      throw new Error('Pilih Tahun Ajaran terlebih dahulu.');
    }

    const res = await api.post('/api/hubin/classes', {
      name: data.name,

      major: data.major,

      academicYearId: selectedAcademicYearId,
    });

    await loadHubinClasses();
    await loadSuperStats();

    return res;
  };

  /*
   * =======================================================
   * DELETE CLASS
   * =======================================================
   */

  const deleteClass = async (id: number) => {
    await api.delete(`/api/hubin/classes/${id}`);

    await loadHubinClasses();
    await loadSuperStats();
  };

  /*
   * =======================================================
   * LOAD CLASS STUDENTS
   * =======================================================
   */

  const loadClassStudents = async (id: number) => {
    const query =
      selectedAcademicYearId !== null
        ? `?academicYearId=${selectedAcademicYearId}`
        : '';

    return await api.get(
      `/api/hubin/classes/${id}/students${query}`
    );
  };

  /*
   * =======================================================
   * KELOLA PENGGUNA HUBIN
   * =======================================================
   */

  const loadHubinUsers = useCallback(
    async (
      filters?: {
        role?: string;
        search?: string;
      },
      yearId: number | null = selectedAcademicYearId
    ): Promise<boolean> => {
      if (!localStorage.getItem('pkl_token')) {
        return false;
      }

      try {
        const params = new URLSearchParams();

        if (filters?.role && filters.role !== 'all') {
          params.set('role', filters.role);
        }

        if (filters?.search) {
          params.set('search', filters.search);
        }

        if (yearId !== null) {
          params.set('academicYearId', String(yearId));
        }

        const query = params.toString();

        const response = await api.get(
          `/api/hubin/users${query ? `?${query}` : ''}`
        );

        const users = getArrayResponse<any>(response);

        setSuperUsers(users);

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil daftar user:',
          error?.message
        );

        return false;
      }
    },
    [selectedAcademicYearId]
  );

  /*
   * =======================================================
   * TOGGLE USER
   * =======================================================
   */

  const toggleUser = async (id: number) => {
    const res = await api.patch(`/api/hubin/users/${id}/toggle`);

    await loadHubinUsers();

    return res;
  };

  /*
   * =======================================================
   * DELETE USER
   * =======================================================
   */

  const deleteUser = async (id: number) => {
    const res = await api.delete(`/api/hubin/users/${id}`);

    await loadHubinUsers();
    await loadSuperStats();

    return res;
  };

  /*
   * =======================================================
   * UPDATE USER ROLE
   * =======================================================
   */

  const updateUserRole = async (id: number, role: string) => {
    const res = await api.patch(`/api/hubin/users/${id}/role`, {
      role,
    });

    await loadHubinUsers();

    return res;
  };

  /*
   * =======================================================
   * RESET PASSWORD
   * =======================================================
   */

  const resetPassword = async (id: number) => {
    const res = (await api.post(
      `/api/hubin/users/${id}/reset-password`
    )) as {
      id: number;
      name: string;
      newPassword: string;
    };

    return res;
  };

  /*
   * =======================================================
   * ADD COMPANY
   * =======================================================
   */

  const addCompany = async (
    data: Partial<PerusahaanItem> & {
      mentorId?: number;
    }
  ) => {
    if (selectedAcademicYearId === null) {
      throw new Error('Pilih Tahun Ajaran terlebih dahulu.');
    }

    if (!data.name?.trim()) {
      throw new Error('Nama perusahaan wajib diisi.');
    }

    if (!data.address?.trim()) {
      throw new Error('Alamat perusahaan wajib diisi.');
    }

    if (
      data.latitude === undefined ||
      data.latitude === null ||
      data.longitude === undefined ||
      data.longitude === null
    ) {
      throw new Error(
        'Latitude dan longitude perusahaan wajib diisi.'
      );
    }

    const latitude = Number(data.latitude);

    const longitude = Number(data.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Latitude dan longitude tidak valid.');
    }

    const body: any = {
      name: data.name.trim(),

      address: data.address.trim(),

      city: data.city,

      country: data.country,

      category: data.category,

      quota: Number(data.quota) || 0,

      latitude,

      longitude,

      radiusMeters: Number(data.radiusMeters) || 500,

      academicYearId: selectedAcademicYearId,
    };

    if (data.mentorId !== undefined) {
      body.mentorId = Number(data.mentorId);
    }

    const res = await api.post('/api/companies', body);

    await loadCompanies();

    return res;
  };

  /*
   * =======================================================
   * UPDATE COMPANY
   * =======================================================
   */

  const updateCompany = async (
    id: number,
    data: Partial<PerusahaanItem>
  ) => {
    const body: any = {};

    if (data.name !== undefined) {
      body.name = data.name;
    }

    if (data.address !== undefined) {
      body.address = data.address;
    }

    if (data.city !== undefined) {
      body.city = data.city;
    }

    if (data.country !== undefined) {
      body.country = data.country;
    }

    if (data.category !== undefined) {
      body.category = data.category;
    }

    if (data.quota !== undefined) {
      body.quota = Number(data.quota);
    }

    if (data.latitude !== undefined) {
      body.latitude = Number(data.latitude);
    }

    if (data.longitude !== undefined) {
      body.longitude = Number(data.longitude);
    }

    if (data.radiusMeters !== undefined) {
      body.radiusMeters = Number(data.radiusMeters);
    }

    const res = await api.patch(`/api/companies/${id}`, body);

    await loadCompanies();

    return res;
  };

  /*
   * =======================================================
   * DELETE COMPANY
   * =======================================================
   */

  const deleteCompany = async (id: number) => {
    const res = await api.delete(`/api/companies/${id}/hard`);

    await loadCompanies();

    return res;
  };

  /*
   * =======================================================
   * CHANGE PASSWORD
   * =======================================================
   */

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  };

  /*
   * =======================================================
   * DELETE ACCOUNT
   * =======================================================
   */

  const deleteAccount = async (password: string) => {
    await api.post('/api/auth/delete-account', {
      password,
    });

    logout();
  };

  /*
   * =======================================================
   * REFRESH DATA
   * =======================================================
   */

  const refreshData = useCallback(async () => {
    if (!localStorage.getItem('pkl_token')) {
      return;
    }

    setIsLoading(true);

    /*
     * Hindari duplicate request dari academic-year useEffect.
     */
    skipAcademicYearEffect.current = true;

    try {
      const yearId = await loadAcademicYears();

      await Promise.all([
        loadLogEntries(),
        loadAttendances(),
        loadSiswa(yearId),
        loadPerizinan(),
        loadDailyStatus(),
        loadCompanies(yearId),
        loadGuru(yearId),
        loadMentor(yearId),
      ]);

      if (localStorage.getItem('pkl_role') === 'hubin') {
        await Promise.all([
          loadSuperStats(yearId),
          loadHubinClasses(yearId),
          loadHubinUsers(undefined, yearId),
        ]);
      }
    } finally {
      skipAcademicYearEffect.current = false;

      setIsLoading(false);
    }
  }, [
    loadAcademicYears,
    loadLogEntries,
    loadAttendances,
    loadSiswa,
    loadPerizinan,
    loadDailyStatus,
    loadCompanies,
    loadGuru,
    loadMentor,
    loadSuperStats,
    loadHubinClasses,
    loadHubinUsers,
  ]);

  /*
   * =======================================================
   * SESSION
   * =======================================================
   */

  const loadSession = useCallback(
    async (overrideToken?: string) => {
      const tokenToUse = overrideToken || token;

      if (!tokenToUse) {
        return;
      }

      try {
        startLoading('session');

        const user = (await api.get('/api/auth/me')) as any;

        const mappedRole = mapBackendRoleToUserRole(user.role);

        setUserName(user.name || '');

        setUserRole(mappedRole);

        setUserId(user.id ?? null);

        setSchoolName(
          user.schoolName ||
            user.institution ||
            user.school?.name ||
            'SMK Negeri 1 Nusantara'
        );

        setUserCompanyName(
          user.companyName || user.company?.name || ''
        );

        setUserCompanyAddress(
          user.companyAddress || user.company?.address || ''
        );

        setUserCompanyLocation(user.companyLocation || null);

        setIsAuthenticated(true);

        localStorage.setItem('pkl_role', mappedRole);

        localStorage.setItem('pkl_user_name', user.name || '');

        /*
         * Hindari duplicate request ketika academic year berubah.
         */
        skipAcademicYearEffect.current = true;

        const yearId = await loadAcademicYears();

        if (mappedRole === 'hubin') {
          await Promise.all([
            loadSiswa(yearId),
            loadGuru(yearId),
            loadMentor(yearId),
            loadCompanies(yearId),
            loadSuperStats(yearId),
            loadHubinClasses(yearId),
            loadHubinUsers(undefined, yearId),
          ]);
        } else {
          await Promise.all([
            loadLogEntries(),
            loadAttendances(),
            loadSiswa(yearId),
            loadPerizinan(),
            loadDailyStatus(),
            loadCompanies(yearId),
            loadGuru(yearId),
            loadMentor(yearId),
          ]);
        }

        skipAcademicYearEffect.current = false;
      } catch (error: any) {
        console.error('Session load error:', error?.message);

        skipAcademicYearEffect.current = false;

        logout();
      } finally {
        stopLoading('session');
      }
    },
    [
      token,
      startLoading,
      stopLoading,
      logout,
      loadAcademicYears,
      loadLogEntries,
      loadAttendances,
      loadSiswa,
      loadPerizinan,
      loadDailyStatus,
      loadCompanies,
      loadGuru,
      loadMentor,
      loadSuperStats,
      loadHubinClasses,
      loadHubinUsers,
    ]
  );

  /*
   * =======================================================
   * RELOAD BERDASARKAN TAHUN AJARAN
   * =======================================================
   */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (skipAcademicYearEffect.current) {
      return;
    }

    const reload = async () => {
      try {
        await Promise.all([
          loadSiswa(),
          loadGuru(),
          loadMentor(),
          loadCompanies(),
        ]);

        if (userRole === 'hubin') {
          await Promise.all([
            loadSuperStats(),
            loadHubinClasses(),
            loadHubinUsers(),
          ]);
        }
      } catch (error: any) {
        console.warn(
          'Gagal refresh berdasarkan Tahun Ajaran:',
          error?.message
        );
      }
    };

    reload();
  }, [
    selectedAcademicYearId,
    isAuthenticated,
    userRole,
    loadSiswa,
    loadGuru,
    loadMentor,
    loadCompanies,
    loadSuperStats,
    loadHubinClasses,
    loadHubinUsers,
  ]);

  /*
   * =======================================================
   * TOKEN SESSION
   * =======================================================
   */

  useEffect(() => {
    if (token) {
      loadSession();
    }
  }, [token, loadSession]);

  /*
   * =======================================================
   * LOGIN
   * =======================================================
   */

  const login = async (email: string, password: string) => {
    try {
      const data = (await api.post('/api/auth/login', {
        email,
        password,
      })) as {
        token: string;
        user: any;
      };

      if (!data?.token) {
        throw new Error('Token login tidak diterima dari server.');
      }

      localStorage.setItem('pkl_token', data.token);

      localStorage.setItem(
        'pkl_role',
        mapBackendRoleToUserRole(data.user.role)
      );

      localStorage.setItem('pkl_user_name', data.user.name || '');

      setToken(data.token);
    } catch (error: any) {
      throw new Error(error?.message || 'Login gagal');
    }
  };

  /*
   * =======================================================
   * REGISTER
   * =======================================================
   */

  const register = async (
    name: string,
    email: string,
    password: string,
    _institution?: string,
    classId?: number
  ) => {
    try {
      const data = (await api.post('/api/auth/register', {
        name,
        email,
        password,
        classId,
      })) as {
        token: string;
        user: any;
      };

      if (!data?.token) {
        throw new Error(
          'Token registrasi tidak diterima dari server.'
        );
      }

      localStorage.setItem('pkl_token', data.token);

      localStorage.setItem(
        'pkl_role',
        mapBackendRoleToUserRole(data.user.role)
      );

      localStorage.setItem('pkl_user_name', data.user.name || '');

      setToken(data.token);
    } catch (error: any) {
      throw new Error(error?.message || 'Registrasi gagal');
    }
  };

  /*
   * =======================================================
   * ADD LOGBOOK
   * =======================================================
   */

  const addLogEntry = async (
    newLog: Omit<LogEntry, 'id' | 'date' | 'status'>
  ) => {
    try {
      await api.post('/api/logbook', {
        activity_title: newLog.title,

        description: newLog.description,

        hours: newLog.hours,

        category: newLog.category,
      });

      await loadLogEntries();
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal membuat logbook');
    }
  };

  /*
   * =======================================================
   * UPDATE LOG STATUS
   * =======================================================
   */

  const updateLogStatus = async (
    id: string,
    status: 'approved' | 'rejected' | 'revision',
    feedback?: string
  ) => {
    try {
      const logId = parseInt(id.replace('LOG-', ''), 10);

      if (Number.isNaN(logId)) {
        throw new Error('ID logbook tidak valid.');
      }

      await api.put(`/api/logbook/${logId}`, {
        status,
        feedback,
      });

      await loadLogEntries();
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal update status logbook'
      );
    }
  };

  /*
   * =======================================================
   * UPDATE LOG ENTRY
   * =======================================================
   */

  const updateLogEntry = async (
    id: string,
    data: {
      title: string;
      description: string;
      hours: number;
      category: string;
    }
  ) => {
    try {
      const logId = parseInt(id.replace('LOG-', ''), 10);

      if (Number.isNaN(logId)) {
        throw new Error('ID logbook tidak valid.');
      }

      await api.put(`/api/logbook/${logId}`, {
        activity_title: data.title,

        description: data.description,

        hours: data.hours,

        category: data.category,
      });

      await loadLogEntries();
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal update logbook');
    }
  };

  /*
   * =======================================================
   * CHECK IN
   * =======================================================
   */

  const checkInAttendance = async (
    _imageUrl?: string,
    latitude?: number,
    longitude?: number
  ) => {
    try {
      await api.post('/api/absensi', {
        status: 'hadir',

        location: 'Current Location',

        latitude,
        longitude,
      });

      await Promise.all([loadAttendances(), loadDailyStatus()]);
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal melakukan absensi');
    }
  };

  /*
   * =======================================================
   * CHECK OUT
   * =======================================================
   */

  const checkOutAttendance = async (
    latitude?: number,
    longitude?: number
  ) => {
    try {
      await api.post('/api/absensi/checkout', {
        latitude,
        longitude,
      });

      await Promise.all([loadAttendances(), loadDailyStatus()]);
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal melakukan absen pulang'
      );
    }
  };

  /*
   * =======================================================
   * UPDATE PERIZINAN
   * =======================================================
   */

  const updatePerizinanStatus = async (
    id: number,
    status: 'approved' | 'rejected',
    rejectReason?: string
  ) => {
    try {
      await api.put(`/api/permissions/${id}`, {
        status,
        rejectReason,
      });

      await Promise.all([
        loadPerizinan(),
        loadAttendances(),
        loadDailyStatus(),
      ]);
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal update status perizinan'
      );
    }
  };

  /*
   * =======================================================
   * CREATE PERMISSION
   * =======================================================
   */

  const createPermission = async (data: {
    type: string;
    reason: string;
    date: string;
    file?: File | null;
    attachmentUrl?: string;
  }) => {
    try {
      const formData = new FormData();

      formData.append('type', data.type);

      formData.append('reason', data.reason);

      formData.append('date', data.date);

      if (data.file) {
        formData.append('file', data.file);
      } else if (data.attachmentUrl) {
        formData.append('attachmentUrl', data.attachmentUrl);
      }

      const res = await api.upload('/api/permissions', formData);

      await Promise.all([loadPerizinan(), loadDailyStatus()]);

      return res;
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal membuat perizinan');
    }
  };

  /*
   * =======================================================
   * DELETE PERMISSION
   * =======================================================
   */

  const deletePermission = async (id: number) => {
    try {
      await api.delete(`/api/permissions/${id}`);

      await Promise.all([loadPerizinan(), loadDailyStatus()]);
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal menghapus perizinan'
      );
    }
  };

  /*
   * =======================================================
   * CREATE ACADEMIC YEAR
   * =======================================================
   */

  const createAcademicYear = async (name: string) => {
    try {
      await api.post('/api/academic-years', {
        name,
      });

      await loadAcademicYears();
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal menambah Tahun Ajaran'
      );
    }
  };

  /*
   * =======================================================
   * UPDATE ACADEMIC YEAR
   * =======================================================
   */

  const updateAcademicYear = async (
    id: number,
    data: {
      name?: string;
      isActive?: boolean;
    }
  ) => {
    try {
      await api.patch(`/api/academic-years/${id}`, data);

      await loadAcademicYears();
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal mengubah Tahun Ajaran'
      );
    }
  };

  /*
   * =======================================================
   * DELETE ACADEMIC YEAR
   * =======================================================
   */

  const deleteAcademicYear = async (id: number) => {
    try {
      await api.delete(`/api/academic-years/${id}`);

      if (selectedAcademicYearId === id) {
        localStorage.removeItem('selectedAcademicYearId');

        setSelectedAcademicYearIdState(null);
      }

      await loadAcademicYears();
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal menghapus Tahun Ajaran'
      );
    }
  };

  /*
   * =======================================================
   * EVALUATION
   * =======================================================
   */

  const submitEvaluation = async (
    siswaId: number,
    nilaiDUDI: number,
    period: string
  ) => {
    try {
      await api.post('/api/evaluations', {
        studentId: siswaId,

        score: nilaiDUDI,

        type: 'dudi',

        period,
      });

      await loadSiswa();
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal submit evaluasi');
    }
  };

  /*
   * =======================================================
   * GURU GRADE
   * =======================================================
   */

  const submitGuruGrade = async (
    siswaId: number,
    nilaiGuru: number,
    period: string
  ) => {
    try {
      await api.post('/api/evaluations', {
        studentId: siswaId,

        score: nilaiGuru,

        type: 'guru',

        period,
      });

      await loadSiswa();
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal submit nilai guru');
    }
  };

  /*
   * =======================================================
   * ADD SISWA
   * =======================================================
   */

  const addSiswa = async (
    newSiswa: Omit<
      SiswaItem,
      | 'id'
      | 'kehadiran'
      | 'logs'
      | 'nilaiDUDI'
      | 'nilaiGuru'
      | 'finalNilai'
      | 'berkasPct'
    >
  ) => {
    try {
      if (selectedAcademicYearId === null) {
        throw new Error('Pilih Tahun Ajaran terlebih dahulu.');
      }

      await api.post('/api/hubin/students', {
        name: newSiswa.name,

        email: `${newSiswa.name
          .toLowerCase()
          .replace(/\s+/g, '.')}@gopkl.id`,

        password: 'gopkl123',

        academicYear: newSiswa.academicYear || undefined,

        academicYearId: selectedAcademicYearId,
      });

      await loadSiswa();
    } catch (error: any) {
      throw new Error(error?.message || 'Gagal menambah siswa');
    }
  };

  /*
   * =======================================================
   * ADD PERUSAHAAN - LEGACY
   * =======================================================
   */

  const addPerusahaan = async (data: {
    name: string;
    address: string;
    quota: number;
    mentor: string;

    city?: string;
    country?: string;
    category?: string;

    latitude?: number;
    longitude?: number;
    radiusMeters?: number;

    mentorId?: number;
  }) => {
    try {
      if (selectedAcademicYearId === null) {
        throw new Error('Pilih Tahun Ajaran terlebih dahulu.');
      }

      if (
        data.latitude === undefined ||
        data.latitude === null ||
        data.longitude === undefined ||
        data.longitude === null
      ) {
        throw new Error(
          'Latitude dan longitude perusahaan wajib diisi.'
        );
      }

      await addCompany({
        name: data.name,

        address: data.address,

        quota: data.quota,

        city: data.city,

        country: data.country,

        category: data.category,

        latitude: data.latitude,

        longitude: data.longitude,

        radiusMeters: data.radiusMeters,

        mentorId: data.mentorId,
      });
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal menambah perusahaan'
      );
    }
  };

  /*
   * =======================================================
   * UPDATE SISWA MAPPING
   * =======================================================
   */

  const updateSiswaMapping = async (
    siswaId: number,
    data: {
      perusahaan: string;
      guruPembimbing: string;
      mentor: string;

      companyId?: number | string;
      teacherId?: number | string;
      mentorName?: string;

      academicYear?: string;
    }
  ) => {
    try {
      await api.patch(`/api/users/${siswaId}`, {
        companyId: data.companyId
          ? Number(data.companyId)
          : undefined,

        teacherId: data.teacherId
          ? Number(data.teacherId)
          : undefined,

        mentorName: data.mentorName,

        academicYear:
          data.academicYear !== undefined
            ? data.academicYear
            : undefined,

        academicYearId: selectedAcademicYearId || undefined,
      });

      await Promise.all([
        loadSiswa(),
        loadGuru(),
        loadMentor(),
        loadCompanies(),
      ]);
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal update pemetaan siswa'
      );
    }
  };

  /*
   * =======================================================
   * UPDATE COMPANY LOCATION / GEOFENCE
   * =======================================================
   */

  const updateCompanyLocation = async (
    companyId: number,
    lat: number,
    lng: number,
    radius: number
  ) => {
    try {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Latitude dan longitude tidak valid.');
      }

      if (!Number.isFinite(radius) || radius <= 0) {
        throw new Error('Radius harus lebih besar dari 0.');
      }

      await api.patch(`/api/companies/${companyId}`, {
        latitude: lat,

        longitude: lng,

        radiusMeters: radius,
      });

      await loadCompanies();
    } catch (error: any) {
      throw new Error(
        error?.message || 'Gagal update lokasi perusahaan'
      );
    }
  };

  /*
   * =======================================================
   * PROVIDER
   * =======================================================
   */

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,

        userRole,

        activePage,
        setActivePage,

        userName,
        schoolName,
        userId,

        userCompanyName,
        userCompanyAddress,
        userCompanyLocation,

        isLoading,
        loadingResources,

        siswaList,
        guruList,
        mentorList,
        perusahaanList,

        logEntries,
        attendances,
        perizinanList,
        dailyStatus,

        academicYears,

        selectedAcademicYearId,
        setSelectedAcademicYearId,

        mapLocations,

        superStats,
        superClasses,
        superUsers,

        addLogEntry,
        updateLogStatus,
        updateLogEntry,

        checkInAttendance,
        checkOutAttendance,

        updatePerizinanStatus,
        createPermission,
        deletePermission,

        createAcademicYear,
        updateAcademicYear,
        deleteAcademicYear,

        submitEvaluation,
        submitGuruGrade,

        addSiswa,
        addPerusahaan,

        updateSiswaMapping,
        updateCompanyLocation,

        login,
        register,
        logout,

        refreshData,

        // loader data (dipakai HubinKelolaData dll.)
        loadSiswa,
        loadGuru,
        loadMentor,
        loadPerusahaan: loadCompanies,

        loadSuperStats,
        loadHubinClasses,

        createClass,
        deleteClass,
        loadClassStudents,

        loadHubinUsers,

        toggleUser,
        deleteUser,
        updateUserRole,
        resetPassword,

        loadCompanies,
        addCompany,
        updateCompany,
        deleteCompany,

        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/*
 * =========================================================
 * USE APP
 * =========================================================
 */

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
};