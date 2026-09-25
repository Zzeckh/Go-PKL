import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  ActivePage,
  AuthMode,
  UserRole,
  LogEntry,
  PKLMapLocation,
  AttendanceRecord,
  AcademicYear,
} from '../types';

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
    nilaiGuru: number,
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

  loadSuperStats: () => Promise<boolean>;

  loadSuperClasses: () => Promise<boolean>;

  createClass: (data: {
    name: string;
    major?: string;
  }) => Promise<any>;

  deleteClass: (id: number) => Promise<void>;

  loadClassStudents: (id: number) => Promise<any>;

  loadSuperUsers: (filters?: {
    role?: string;
    search?: string;
  }) => Promise<boolean>;

  toggleUser: (id: number) => Promise<any>;

  deleteUser: (id: number) => Promise<any>;

  updateUserRole: (id: number, role: string) => Promise<any>;

  resetPassword: (
    id: number
  ) => Promise<{
    id: number;
    name: string;
    newPassword: string;
  }>;

  loadCompanies: () => Promise<boolean>;

  addCompany: (
    data: Partial<PerusahaanItem>
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

const AppContext = createContext<AppContextType | undefined>(
  undefined
);

const mapBackendRoleToUserRole = (
  role: string
): UserRole => {
  switch (role) {
    case 'student':
      return 'intern';

    case 'teacher':
      return 'teacher';

    case 'mentor':
      return 'mentor';

    case 'hubin':
      return 'hubin';

    case 'super_admin':
      return 'super_admin';

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

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [userRole, setUserRole] =
    useState<UserRole>('intern');

  const [activePage, setActivePage] =
    useState<ActivePage>('dashboard');

  const [userName, setUserName] =
    useState('');

  const [userId, setUserId] =
    useState<number | null>(null);

  const [schoolName, setSchoolName] = useState(
    'SMK Negeri 1 Nusantara'
  );

  const [userCompanyName, setUserCompanyName] =
    useState('');

  const [userCompanyAddress, setUserCompanyAddress] =
    useState('');

  const [userCompanyLocation, setUserCompanyLocation] =
    useState<{
      lat: number;
      lng: number;
      radius: number;
    } | null>(null);

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('pkl_token')
  );

  const [isLoading, setIsLoading] =
    useState(false);

  const [loadingResources, setLoadingResources] =
    useState<Set<string>>(new Set());

  const [siswaList, setSiswaList] =
    useState<SiswaItem[]>([]);

  const [guruList, setGuruList] =
    useState<GuruItem[]>([]);

  const [mentorList, setMentorList] =
    useState<MentorItem[]>([]);

  const [perusahaanList, setPerusahaanList] =
    useState<PerusahaanItem[]>([]);

  const [logEntries, setLogEntries] =
    useState<LogEntry[]>([]);

  const [attendances, setAttendances] =
    useState<AttendanceRecord[]>([]);

  const [perizinanList, setPerizinanList] =
    useState<PerizinanItem[]>([]);

  const [dailyStatus, setDailyStatus] =
    useState<DailyStatus | null>(null);

  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  /*
   * ==========================================
   * TAHUN AJARAN YANG DIPILIH
   * ==========================================
   */

  const [
    selectedAcademicYearId,
    setSelectedAcademicYearIdState,
  ] = useState<number | null>(() => {
    const saved =
      localStorage.getItem(
        'selectedAcademicYearId'
      );

    return saved ? Number(saved) : null;
  });

  const [mapLocations, setMapLocations] =
    useState<PKLMapLocation[]>([]);

  const [superStats, setSuperStats] =
    useState<any>(null);

  const [superClasses, setSuperClasses] =
    useState<ClassItem[]>([]);

  const [superUsers, setSuperUsers] =
    useState<any[]>([]);

  /*
   * ==========================================
   * LOADING HELPER
   * ==========================================
   */

  const startLoading = useCallback(
    (resource: string) => {
      setLoadingResources(prev => {
        const next = new Set(prev);
        next.add(resource);
        return next;
      });
    },
    []
  );

  const stopLoading = useCallback(
    (resource: string) => {
      setLoadingResources(prev => {
        const next = new Set(prev);
        next.delete(resource);
        return next;
      });
    },
    []
  );

  /*
   * ==========================================
   * SET TAHUN AJARAN
   * ==========================================
   */

  const setSelectedAcademicYearId =
    useCallback((id: number | null) => {
      setSelectedAcademicYearIdState(id);

      if (id === null) {
        localStorage.removeItem(
          'selectedAcademicYearId'
        );
      } else {
        localStorage.setItem(
          'selectedAcademicYearId',
          String(id)
        );
      }
    }, []);

  /*
   * ==========================================
   * LOGOUT
   * ==========================================
   */

  const logout = useCallback(() => {
    localStorage.removeItem('pkl_token');
    localStorage.removeItem('pkl_role');
    localStorage.removeItem('pkl_user_name');

    /*
     * Tahun ajaran tetap disimpan.
     */

    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);

    setActivePage('dashboard');
    setUserRole('intern');
    setUserName('');

    setSchoolName(
      'SMK Negeri 1 Nusantara'
    );

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
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  /*
   * ==========================================
   * LOGBOOK
   * ==========================================
   */

  const loadLogEntries = useCallback(async () => {
    try {
      startLoading('logbook');

      const response =
        await api.get(
          '/api/logbook'
        ) as any[];

      const mapped = response.map(
        (item: any): LogEntry => ({
          id: `LOG-${item.id}`,

          date: formatDate(item.date),

          title:
            item.activityTitle,

          description:
            item.description,

          hours:
            item.hours || 8,

          category:
            item.category ||
            'PKL Activity',

          status:
            item.status === 'approved'
              ? 'approved'
              : item.status === 'rejected'
              ? 'revision'
              : 'pending',

          feedback:
            item.feedback,

          userId:
            item.user?.id,

          userName:
            item.user?.name,

          userClass:
            item.user?.class?.name,
        })
      );

      setLogEntries(mapped);
    } catch (error: any) {
      console.warn(
        'Gagal mengambil logbook:',
        error?.message
      );
    } finally {
      stopLoading('logbook');
    }
  }, [startLoading, stopLoading]);

  /*
   * ==========================================
   * ABSENSI
   * ==========================================
   */

  const loadAttendances =
    useCallback(async () => {
      try {
        startLoading('absensi');

        const absensi =
          await api.get(
            '/api/absensi'
          ) as any[];

        const mapped =
          absensi.map(
            (item: any): AttendanceRecord => ({
              id:
                `ATT-${item.id}`,

              date:
                formatDate(item.date),

              checkInTime:
                item.checkInTime
                  ? new Date(
                      item.checkInTime
                    ).toLocaleTimeString(
                      'id-ID',
                      {
                        hour: '2-digit',
                        minute:
                          '2-digit',
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

              userId:
                item.user?.id ||
                item.userId,
            })
          );

        setAttendances(mapped);
      } catch (error: any) {
        console.warn(
          'Gagal mengambil absensi:',
          error?.message
        );
      } finally {
        stopLoading('absensi');
      }
    }, [startLoading, stopLoading]);

  /*
   * ==========================================
   * SISWA
   * ==========================================
   */

  const loadSiswa = useCallback(async () => {
    try {
      startLoading('siswa');

      const params =
        new URLSearchParams();

      params.set(
        'role',
        'student'
      );

      if (selectedAcademicYearId) {
        params.set(
          'academicYearId',
          String(
            selectedAcademicYearId
          )
        );
      }

      const response =
        await api.get(
          `/api/users?${params.toString()}`
        ) as any[];

      const mapped =
        response.map(
          (u: any): SiswaItem => {
            const evals =
              u.evalAsStudent || [];

            const dudiEval =
              evals.find(
                (e: any) =>
                  e.type === 'dudi'
              );

            const guruEval =
              evals.find(
                (e: any) =>
                  e.type === 'guru'
              );

            const nilaiDUDI =
              dudiEval
                ? String(
                    dudiEval.score
                  )
                : '0';

            const nilaiGuru =
              guruEval
                ? String(
                    guruEval.score
                  )
                : '0';

            const d =
              dudiEval
                ? dudiEval.score
                : 0;

            const g =
              guruEval
                ? guruEval.score
                : 0;

            const finalNilai =
              d && g
                ? String(
                    Math.round(
                      (d + g) / 2
                    )
                  )
                : String(
                    g || d || 0
                  );

            return {
              id: u.id,

              name: u.name,

              kelas:
                u.class?.name ||
                '-',

              academicYear:
                u.academicYear ||
                u.academicYearRef?.name ||
                '-',

              perusahaan:
                u.company?.name ||
                '-',

              guruPembimbing:
                u.teacher?.name ||
                '-',

              mentor:
                u.company?.mentor?.name ||
                '-',

              kehadiran:
                u._count?.absensis ||
                0,

              logs:
                u._count?.logbooks ||
                0,

              nilaiDUDI,
              nilaiGuru,
              finalNilai,

              berkasPct: 0,

              img: '',
            };
          }
        );

      setSiswaList(mapped);
    } catch (error: any) {
      console.warn(
        'Gagal mengambil siswa:',
        error?.message
      );
    } finally {
      stopLoading('siswa');
    }
  }, [
    selectedAcademicYearId,
    startLoading,
    stopLoading,
  ]);

  /*
   * ==========================================
   * GURU
   * ==========================================
   */

  const loadGuru = useCallback(async () => {
    try {
      startLoading('guru');

      const params =
        new URLSearchParams();

      params.set(
        'role',
        'teacher'
      );

      if (selectedAcademicYearId) {
        params.set(
          'academicYearId',
          String(
            selectedAcademicYearId
          )
        );
      }

      const response =
        await api.get(
          `/api/users?${params.toString()}`
        ) as any[];

      const mapped =
        response.map(
          (u: any): GuruItem => ({
            id: u.id,

            name: u.name,

            subject:
              'Guru Pembimbing',

            totalSiswa:
              u._count?.students ??
              0,

            totalDUDI: 0,
          })
        );

      setGuruList(mapped);
    } catch (error: any) {
      console.warn(
        'Gagal mengambil guru:',
        error?.message
      );
    } finally {
      stopLoading('guru');
    }
  }, [
    selectedAcademicYearId,
    startLoading,
    stopLoading,
  ]);

  /*
   * ==========================================
   * MENTOR
   * ==========================================
   */

  const loadMentor =
    useCallback(async () => {
      try {
        startLoading('mentor');

        const mentorParams =
          new URLSearchParams();

        mentorParams.set(
          'role',
          'mentor'
        );

        if (selectedAcademicYearId) {
          mentorParams.set(
            'academicYearId',
            String(
              selectedAcademicYearId
            )
          );
        }

        const response =
          await api.get(
            `/api/users?${mentorParams.toString()}`
          ) as any[];

        const studentParams =
          new URLSearchParams();

        studentParams.set(
          'role',
          'student'
        );

        if (selectedAcademicYearId) {
          studentParams.set(
            'academicYearId',
            String(
              selectedAcademicYearId
            )
          );
        }

        const studentsResponse =
          await api.get(
            `/api/users?${studentParams.toString()}`
          ) as any[];

        const mapped =
          response.map(
            (u: any): MentorItem => {
              const studentsOfMentor =
                studentsResponse.filter(
                  (student: any) =>
                    student.company?.mentor?.id ===
                    u.id
                );

              const perusahaanNames =
                Array.from(
                  new Set(
                    studentsOfMentor
                      .map(
                        (student: any) =>
                          student.company?.name
                      )
                      .filter(Boolean)
                  )
                );

              return {
                id: u.id,

                name: u.name,

                perusahaan:
                  u.company?.name ||
                  perusahaanNames.join(
                    ', '
                  ) ||
                  '-',

                role: 'Mentor',

                totalSiswa:
                  studentsOfMentor.length,
              };
            }
          );

        setMentorList(mapped);
      } catch (error: any) {
        console.warn(
          'Gagal mengambil mentor:',
          error?.message
        );
      } finally {
        stopLoading('mentor');
      }
    }, [
      selectedAcademicYearId,
      startLoading,
      stopLoading,
    ]);

  /*
   * ==========================================
   * PERIZINAN
   * ==========================================
   */

  const loadPerizinan =
    useCallback(async () => {
      try {
        startLoading('perizinan');

        const response =
          await api.get(
            '/api/permissions'
          ) as any[];

        const mapped =
          response.map(
            (p: any): PerizinanItem => ({
              id: p.id,

              name:
                p.user?.name ||
                'Unknown',

              userId:
                p.user?.id ||
                p.userId,

              company: '-',

              date:
                formatDate(p.date),

              type:
                p.type === 'sakit'
                  ? 'Sakit'
                  : 'Izin',

              reason:
                p.reason,

              attachment:
                p.attachmentUrl ||
                '',

              status:
                p.status,
            })
          );

        setPerizinanList(mapped);
      } catch (error: any) {
        console.warn(
          'Gagal mengambil perizinan:',
          error?.message
        );
      } finally {
        stopLoading('perizinan');
      }
    }, [startLoading, stopLoading]);

  /*
   * ==========================================
   * DAILY STATUS
   * ==========================================
   */

  const loadDailyStatus =
    useCallback(async () => {
      try {
        startLoading(
          'dailyStatus'
        );

        const res =
          await api.get(
            '/api/absensi/status'
          ) as any;

        setDailyStatus({
          date: res.date,

          status:
            res.status,

          canCheckIn:
            !!res.canCheckIn,

          canRequestPermission:
            !!res.canRequestPermission,

          canDeletePermission:
            !!res.canDeletePermission,

          permissionId:
            res.permission?.id ??
            null,
        });
      } catch (error: any) {
        console.warn(
          'Gagal mengambil status harian:',
          error?.message
        );
      } finally {
        stopLoading(
          'dailyStatus'
        );
      }
    }, [startLoading, stopLoading]);

  /*
   * ==========================================
   * ACADEMIC YEARS
   * ==========================================
   */

  const loadAcademicYears =
    useCallback(async () => {
      try {
        startLoading(
          'academicYears'
        );

        const res =
          await api.get(
            '/api/academic-years'
          ) as AcademicYear[];

        const years =
          res || [];

        setAcademicYears(
          years
        );

        /*
         * Cek pilihan yang tersimpan.
         */
        const savedId =
          localStorage.getItem(
            'selectedAcademicYearId'
          );

        if (savedId) {
          const parsedId =
            Number(savedId);

          const exists =
            years.some(
              year =>
                year.id ===
                parsedId
            );

          if (exists) {
            setSelectedAcademicYearIdState(
              parsedId
            );

            return;
          }
        }

        /*
         * Kalau tidak ada pilihan,
         * gunakan tahun aktif.
         */
        const activeYear =
          years.find(
            year =>
              year.isActive
          );

        if (activeYear) {
          setSelectedAcademicYearIdState(
            activeYear.id
          );

          localStorage.setItem(
            'selectedAcademicYearId',
            String(
              activeYear.id
            )
          );
        }
      } catch (error: any) {
        console.warn(
          'Gagal mengambil data Tahun Ajaran:',
          error?.message
        );
      } finally {
        stopLoading(
          'academicYears'
        );
      }
    }, [
      startLoading,
      stopLoading,
    ]);

  /*
   * ==========================================
   * PERUSAHAAN
   * ==========================================
   */

  const loadPerusahaan =
    useCallback(async () => {
      try {
        startLoading(
          'perusahaan'
        );

        const query =
          selectedAcademicYearId
            ? `?academicYearId=${selectedAcademicYearId}`
            : '';

        const response =
          await api.get(
            `/api/companies${query}`
          ) as {
            data: any[];
          };

        const mapped =
          response.data.map(
            (c: any): PerusahaanItem => ({
              id: c.id,

              name:
                c.name,

              address:
                c.address ||
                '-',

              city:
                c.city ||
                undefined,

              country:
                c.country ||
                undefined,

              category:
                c.category ||
                undefined,

              quota:
                c.quota ||
                0,

              filled:
                c.filled ||
                0,

              mentor:
                c.mentor?.name ||
                undefined,

              latitude:
                c.latitude ??
                null,

              longitude:
                c.longitude ??
                null,

              radiusMeters:
                c.radiusMeters ||
                500,
            })
          );

        setPerusahaanList(
          mapped
        );
      } catch (error: any) {
        console.warn(
          'Gagal mengambil perusahaan:',
          error?.message
        );
      } finally {
        stopLoading(
          'perusahaan'
        );
      }
    }, [
      selectedAcademicYearId,
      startLoading,
      stopLoading,
    ]);

  /*
   * ==========================================
   * SUPER ADMIN STATS
   * ==========================================
   */

  const loadSuperStats =
    useCallback(async (): Promise<boolean> => {
      if (
        !localStorage.getItem(
          'pkl_token'
        )
      ) {
        return false;
      }

      try {
        const params =
          new URLSearchParams();

        if (
          selectedAcademicYearId
        ) {
          params.set(
            'academicYearId',
            String(
              selectedAcademicYearId
            )
          );
        }

        const query =
          params.toString();

        const res =
          await api.get(
            `/api/super-admin/stats${
              query
                ? `?${query}`
                : ''
            }`
          ) as any;

        setSuperStats(
          res
        );

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil super stats:',
          error?.message
        );

        return false;
      }
    }, [
      selectedAcademicYearId,
    ]);

  /*
   * ==========================================
   * SUPER ADMIN CLASSES
   * ==========================================
   */

  const loadSuperClasses =
    useCallback(async (): Promise<boolean> => {
      if (
        !localStorage.getItem(
          'pkl_token'
        )
      ) {
        return false;
      }

      /*
       * Jangan mengambil semua kelas
       * jika tahun belum dipilih.
       */
      if (
        !selectedAcademicYearId
      ) {
        setSuperClasses([]);
        return false;
      }

      try {
        const params =
          new URLSearchParams();

        params.set(
          'academicYearId',
          String(
            selectedAcademicYearId
          )
        );

        const res =
          await api.get(
            `/api/super-admin/classes?${params.toString()}`
          ) as any[];

        setSuperClasses(
          res || []
        );

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil daftar kelas:',
          error?.message
        );

        return false;
      }
    }, [
      selectedAcademicYearId,
    ]);

  /*
   * ==========================================
   * CREATE CLASS
   * ==========================================
   */

  const createClass = async (
    data: {
      name: string;
      major?: string;
    }
  ) => {
    /*
     * WAJIB ada tahun ajaran.
     */
    if (
      !selectedAcademicYearId
    ) {
      throw new Error(
        'Pilih Tahun Ajaran terlebih dahulu.'
      );
    }

    const res =
      await api.post(
        '/api/super-admin/classes',
        {
          name:
            data.name,

          major:
            data.major,

          academicYearId:
            selectedAcademicYearId,
        }
      );

    /*
     * Refresh kelas pada
     * tahun yang sedang dipilih.
     */
    await loadSuperClasses();

    /*
     * Refresh statistik.
     */
    await loadSuperStats();

    return res;
  };

  /*
   * ==========================================
   * DELETE CLASS
   * ==========================================
   */

  const deleteClass = async (
    id: number
  ) => {
    await api.delete(
      `/api/super-admin/classes/${id}`
    );

    await loadSuperClasses();
    await loadSuperStats();
  };

  /*
   * ==========================================
   * CLASS STUDENTS
   * ==========================================
   */

  const loadClassStudents =
    async (id: number) => {
      if (
        !selectedAcademicYearId
      ) {
        throw new Error(
          'Pilih Tahun Ajaran terlebih dahulu.'
        );
      }

      return await api.get(
        `/api/super-admin/classes/${id}/students?academicYearId=${selectedAcademicYearId}`
      ) as any;
    };

  /*
   * ==========================================
   * SUPER ADMIN USERS
   * ==========================================
   */

  const loadSuperUsers =
    useCallback(
      async (
        filters?: {
          role?: string;
          search?: string;
        }
      ): Promise<boolean> => {
        if (
          !localStorage.getItem(
            'pkl_token'
          )
        ) {
          return false;
        }

        if (
          !selectedAcademicYearId
        ) {
          setSuperUsers([]);
          return false;
        }

        try {
          const params =
            new URLSearchParams();

          if (
            filters?.role &&
            filters.role !== 'all'
          ) {
            params.set(
              'role',
              filters.role
            );
          }

          if (
            filters?.search
          ) {
            params.set(
              'search',
              filters.search
            );
          }

          params.set(
            'academicYearId',
            String(
              selectedAcademicYearId
            )
          );

          const query =
            params.toString();

          const res =
            await api.get(
              `/api/super-admin/users?${query}`
            ) as any[];

          setSuperUsers(
            res || []
          );

          return true;
        } catch (error: any) {
          console.warn(
            'Gagal mengambil daftar user:',
            error?.message
          );

          return false;
        }
      },
      [
        selectedAcademicYearId,
      ]
    );

  /*
   * ==========================================
   * TOGGLE USER
   * ==========================================
   */

  const toggleUser = async (
    id: number
  ) => {
    const res =
      await api.patch(
        `/api/super-admin/users/${id}/toggle`
      );

    await loadSuperUsers();

    return res;
  };

  /*
   * ==========================================
   * DELETE USER
   * ==========================================
   */

  const deleteUser = async (
    id: number
  ) => {
    const res =
      await api.delete(
        `/api/super-admin/users/${id}`
      );

    await loadSuperUsers();
    await loadSuperStats();

    return res;
  };

  /*
   * ==========================================
   * UPDATE ROLE
   * ==========================================
   */

  const updateUserRole =
    async (
      id: number,
      role: string
    ) => {
      const res =
        await api.patch(
          `/api/super-admin/users/${id}/role`,
          { role }
        );

      await loadSuperUsers();

      return res;
    };

  /*
   * ==========================================
   * RESET PASSWORD
   * ==========================================
   */

  const resetPassword =
    async (id: number) => {
      const res =
        await api.post(
          `/api/super-admin/users/${id}/reset-password`
        ) as {
          id: number;
          name: string;
          newPassword: string;
        };

      return res;
    };

  /*
   * ==========================================
   * LOAD COMPANIES
   * ==========================================
   */

  const loadCompanies =
    useCallback(async (): Promise<boolean> => {
      if (
        !localStorage.getItem(
          'pkl_token'
        )
      ) {
        return false;
      }

      try {
        const query =
          selectedAcademicYearId
            ? `?academicYearId=${selectedAcademicYearId}`
            : '';

        const res =
          await api.get(
            `/api/companies${query}`
          ) as {
            data: any[];
          };

        const mapped =
          res.data.map(
            (c: any): PerusahaanItem => ({
              id: c.id,

              name:
                c.name,

              address:
                c.address ||
                '-',

              city:
                c.city ||
                undefined,

              country:
                c.country ||
                undefined,

              category:
                c.category ||
                undefined,

              quota:
                c.quota ||
                0,

              filled:
                c.filled ||
                0,

              mentor:
                c.mentor?.name ||
                undefined,

              latitude:
                c.latitude ??
                null,

              longitude:
                c.longitude ??
                null,

              radiusMeters:
                c.radiusMeters ||
                500,
            })
          );

        setPerusahaanList(
          mapped
        );

        return true;
      } catch (error: any) {
        console.warn(
          'Gagal mengambil daftar perusahaan:',
          error?.message
        );

        return false;
      }
    }, [
      selectedAcademicYearId,
    ]);

  /*
   * ==========================================
   * ADD COMPANY
   * ==========================================
   */

  const addCompany = async (
    data: Partial<PerusahaanItem>
  ) => {
    if (
      !selectedAcademicYearId
    ) {
      throw new Error(
        'Pilih Tahun Ajaran terlebih dahulu.'
      );
    }

    const res =
      await api.post(
        '/api/companies',
        {
          name:
            data.name,

          address:
            data.address,

          category:
            data.category,

          quota:
            Number(
              data.quota
            ) || 0,

          latitude:
            data.latitude,

          longitude:
            data.longitude,

          radiusMeters:
            Number(
              data.radiusMeters
            ) || 500,

          academicYearId:
            selectedAcademicYearId,
        }
      );

    await loadCompanies();

    return res;
  };

  /*
   * ==========================================
   * UPDATE COMPANY
   * ==========================================
   */

  const updateCompany =
    async (
      id: number,
      data: Partial<PerusahaanItem>
    ) => {
      const res =
        await api.patch(
          `/api/companies/${id}`,
          {
            name:
              data.name,

            address:
              data.address,

            category:
              data.category,

            quota:
              data.quota !==
              undefined
                ? Number(
                    data.quota
                  )
                : undefined,

            latitude:
              data.latitude,

            longitude:
              data.longitude,

            radiusMeters:
              data.radiusMeters !==
              undefined
                ? Number(
                    data.radiusMeters
                  )
                : undefined,
          }
        );

      await loadCompanies();

      return res;
    };

  /*
   * ==========================================
   * DELETE COMPANY
   * ==========================================
   */

  const deleteCompany =
    async (id: number) => {
      const res =
        await api.delete(
          `/api/companies/${id}/hard`
        );

      await loadCompanies();

      return res;
    };

  /*
   * ==========================================
   * CHANGE PASSWORD
   * ==========================================
   */

  const changePassword =
    async (
      currentPassword: string,
      newPassword: string
    ) => {
      await api.post(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword,
        }
      );
    };

  /*
   * ==========================================
   * DELETE ACCOUNT
   * ==========================================
   */

  const deleteAccount =
    async (password: string) => {
      await api.post(
        '/api/auth/delete-account',
        { password }
      );

      logout();
    };

  /*
   * ==========================================
   * REFRESH DATA
   * ==========================================
   */

  const refreshData =
    useCallback(async () => {
      setIsLoading(true);

      try {
        /*
         * Tahun ajaran harus dimuat
         * terlebih dahulu.
         */
        await loadAcademicYears();

        /*
         * Data umum.
         */
        await Promise.all([
          loadLogEntries(),
          loadAttendances(),
          loadSiswa(),
          loadPerizinan(),
          loadDailyStatus(),
          loadPerusahaan(),
          loadGuru(),
          loadMentor(),
        ]);

        /*
         * Data Super Admin.
         *
         * Jika tahun ajaran baru saja
         * ditentukan oleh loadAcademicYears,
         * useEffect di bawah akan melakukan
         * reload berdasarkan ID tersebut.
         */
        if (
          localStorage.getItem(
            'pkl_role'
          ) === 'super_admin'
        ) {
          await Promise.all([
            loadSuperStats(),
            loadSuperClasses(),
            loadSuperUsers(),
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }, [
      loadAcademicYears,
      loadLogEntries,
      loadAttendances,
      loadSiswa,
      loadPerizinan,
      loadDailyStatus,
      loadPerusahaan,
      loadGuru,
      loadMentor,
      loadSuperStats,
      loadSuperClasses,
      loadSuperUsers,
    ]);

  /*
   * ==========================================
   * SESSION
   * ==========================================
   */

  const loadSession = async (
    overrideToken?: string
  ) => {
    const tokenToUse =
      overrideToken || token;

    if (!tokenToUse) {
      return;
    }

    try {
      startLoading('session');

      const user =
        await api.get(
          '/api/auth/me'
        ) as any;

      const mappedRole =
        mapBackendRoleToUserRole(
          user.role
        );

      setUserName(
        user.name
      );

      setUserRole(
        mappedRole
      );

      setUserId(
        user.id
      );

      setUserCompanyName(
        user.companyName ||
        ''
      );

      setUserCompanyAddress(
        user.companyAddress ||
        ''
      );

      setUserCompanyLocation(
        user.companyLocation ||
        null
      );

      setIsAuthenticated(
        true
      );

      /*
       * Ambil Tahun Ajaran dahulu.
       */
      await loadAcademicYears();

      /*
       * Data akan direload oleh
       * useEffect setelah selectedAcademicYearId
       * berubah.
       */
      if (
        mappedRole !==
        'super_admin'
      ) {
        await Promise.all([
          loadLogEntries(),
          loadAttendances(),
          loadSiswa(),
          loadPerizinan(),
          loadDailyStatus(),
          loadPerusahaan(),
          loadGuru(),
          loadMentor(),
        ]);
      }
    } catch (error: any) {
      console.error(
        'Session load error:',
        error?.message
      );

      logout();
    } finally {
      stopLoading(
        'session'
      );
    }
  };

  /*
   * ==========================================
   * RELOAD SAAT TAHUN AJARAN BERUBAH
   * ==========================================
   */

  useEffect(() => {
    if (
      !isAuthenticated
    ) {
      return;
    }

    if (
      !selectedAcademicYearId
    ) {
      return;
    }

    const reloadByAcademicYear =
      async () => {
        try {
          /*
           * Semua data yang memiliki
           * hubungan dengan tahun ajaran
           * diambil ulang.
           */
          await Promise.all([
            loadSiswa(),
            loadGuru(),
            loadMentor(),
            loadPerusahaan(),
          ]);

          /*
           * Khusus Super Admin.
           */
          if (
            userRole ===
            'super_admin'
          ) {
            await Promise.all([
              loadSuperStats(),
              loadSuperClasses(),
              loadSuperUsers(),
            ]);
          }
        } catch (error: any) {
          console.warn(
            'Gagal refresh berdasarkan Tahun Ajaran:',
            error?.message
          );
        }
      };

    reloadByAcademicYear();
  }, [
    selectedAcademicYearId,
    isAuthenticated,
    userRole,
    loadSiswa,
    loadGuru,
    loadMentor,
    loadPerusahaan,
    loadSuperStats,
    loadSuperClasses,
    loadSuperUsers,
  ]);

  /*
   * ==========================================
   * SESSION TOKEN
   * ==========================================
   */

  useEffect(() => {
    if (token) {
      loadSession();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /*
   * ==========================================
   * LOGIN
   * ==========================================
   */

  const login = async (
    email: string,
    password: string
  ) => {
    try {
      const data =
        await api.post(
          '/api/auth/login',
          {
            email,
            password,
          }
        ) as {
          token: string;
          user: any;
        };

      localStorage.setItem(
        'pkl_token',
        data.token
      );

      localStorage.setItem(
        'pkl_role',
        mapBackendRoleToUserRole(
          data.user.role
        )
      );

      localStorage.setItem(
        'pkl_user_name',
        data.user.name
      );

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            50
          )
      );

      setToken(
        data.token
      );
    } catch (error: any) {
      throw new Error(
        error.message ||
        'Login gagal'
      );
    }
  };

  /*
   * ==========================================
   * REGISTER
   * ==========================================
   */

  const register = async (
    name: string,
    email: string,
    password: string,
    _institution?: string,
    classId?: number
  ) => {
    try {
      const data =
        await api.post(
          '/api/auth/register',
          {
            name,
            email,
            password,
            classId,
          }
        ) as {
          token: string;
          user: any;
        };

      localStorage.setItem(
        'pkl_token',
        data.token
      );

      localStorage.setItem(
        'pkl_role',
        mapBackendRoleToUserRole(
          data.user.role
        )
      );

      localStorage.setItem(
        'pkl_user_name',
        data.user.name
      );

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            50
          )
      );

      setToken(
        data.token
      );
    } catch (error: any) {
      throw new Error(
        error.message ||
        'Registrasi gagal'
      );
    }
  };

  /*
   * ==========================================
   * ADD LOGBOOK
   * ==========================================
   */

  const addLogEntry = async (
    newLog: Omit<
      LogEntry,
      'id' | 'date' | 'status'
    >
  ) => {
    try {
      const created =
        await api.post(
          '/api/logbook',
          {
            activity_title:
              newLog.title,

            description:
              newLog.description,

            hours:
              newLog.hours,

            category:
              newLog.category,
          }
        ) as any;

      const entry: LogEntry = {
        id:
          `LOG-${created.id}`,

        date:
          formatDate(
            created.date
          ),

        title:
          created.activityTitle,

        description:
          created.description,

        hours:
          created.hours,

        category:
          created.category,

        status:
          'pending',
      };

      setLogEntries(
        prev => [
          entry,
          ...prev,
        ]
      );

      await loadLogEntries();
    } catch (error: any) {
      throw new Error(
        error.message ||
        'Gagal membuat logbook'
      );
    }
  };

  /*
   * ==========================================
   * UPDATE LOG STATUS
   * ==========================================
   */

  const updateLogStatus =
    async (
      id: string,
      status:
        | 'approved'
        | 'rejected'
        | 'revision',
      feedback?: string
    ) => {
      try {
        const logId =
          parseInt(
            id.replace(
              'LOG-',
              ''
            )
          );

        await api.put(
          `/api/logbook/${logId}`,
          {
            status,
            feedback,
          }
        );

        await loadLogEntries();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal update status logbook'
        );
      }
    };

  /*
   * ==========================================
   * UPDATE LOG ENTRY
   * ==========================================
   */

  const updateLogEntry =
    async (
      id: string,
      data: {
        title: string;
        description: string;
        hours: number;
        category: string;
      }
    ) => {
      try {
        const logId =
          parseInt(
            id.replace(
              'LOG-',
              ''
            )
          );

        await api.put(
          `/api/logbook/${logId}`,
          {
            activity_title:
              data.title,

            description:
              data.description,

            hours:
              data.hours,

            category:
              data.category,
          }
        );

        await loadLogEntries();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal update logbook'
        );
      }
    };

  /*
   * ==========================================
   * CHECK IN
   * ==========================================
   */

  const checkInAttendance =
    async (
      _imageUrl?: string,
      latitude?: number,
      longitude?: number
    ) => {
      try {
        await api.post(
          '/api/absensi',
          {
            status:
              'hadir',

            location:
              'Current Location',

            latitude,
            longitude,
          }
        );

        await Promise.all([
          loadAttendances(),
          loadDailyStatus(),
        ]);
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal melakukan absensi'
        );
      }
    };

  /*
   * ==========================================
   * UPDATE PERIZINAN
   * ==========================================
   */

  const updatePerizinanStatus =
    async (
      id: number,
      status:
        | 'approved'
        | 'rejected',
      rejectReason?: string
    ) => {
      try {
        await api.put(
          `/api/permissions/${id}`,
          {
            status,
            rejectReason,
          }
        );

        await loadPerizinan();
        await loadAttendances();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal update status perizinan'
        );
      }
    };

  /*
   * ==========================================
   * CREATE PERMISSION
   * ==========================================
   */

  const createPermission =
    async (data: {
      type: string;
      reason: string;
      date: string;
      file?: File | null;
      attachmentUrl?: string;
    }) => {
      try {
        const formData =
          new FormData();

        formData.append(
          'type',
          data.type
        );

        formData.append(
          'reason',
          data.reason
        );

        formData.append(
          'date',
          data.date
        );

        if (data.file) {
          formData.append(
            'file',
            data.file
          );
        } else if (
          data.attachmentUrl
        ) {
          formData.append(
            'attachmentUrl',
            data.attachmentUrl
          );
        }

        const res =
          await api.upload(
            '/api/permissions',
            formData
          );

        await Promise.all([
          loadPerizinan(),
          loadDailyStatus(),
        ]);

        return res;
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal membuat perizinan'
        );
      }
    };

  /*
   * ==========================================
   * DELETE PERMISSION
   * ==========================================
   */

  const deletePermission =
    async (id: number) => {
      try {
        await api.delete(
          `/api/permissions/${id}`
        );

        await Promise.all([
          loadPerizinan(),
          loadDailyStatus(),
        ]);
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal menghapus perizinan'
        );
      }
    };

  /*
   * ==========================================
   * CREATE ACADEMIC YEAR
   * ==========================================
   */

  const createAcademicYear =
    async (name: string) => {
      try {
        await api.post(
          '/api/academic-years',
          { name }
        );

        await loadAcademicYears();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal menambah Tahun Ajaran'
        );
      }
    };

  /*
   * ==========================================
   * UPDATE ACADEMIC YEAR
   * ==========================================
   */

  const updateAcademicYear =
    async (
      id: number,
      data: {
        name?: string;
        isActive?: boolean;
      }
    ) => {
      try {
        await api.patch(
          `/api/academic-years/${id}`,
          data
        );

        await loadAcademicYears();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal mengubah Tahun Ajaran'
        );
      }
    };

  /*
   * ==========================================
   * DELETE ACADEMIC YEAR
   * ==========================================
   */

  const deleteAcademicYear =
    async (id: number) => {
      try {
        await api.delete(
          `/api/academic-years/${id}`
        );

        if (
          selectedAcademicYearId ===
          id
        ) {
          localStorage.removeItem(
            'selectedAcademicYearId'
          );

          setSelectedAcademicYearIdState(
            null
          );
        }

        await loadAcademicYears();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal menghapus Tahun Ajaran'
        );
      }
    };

  /*
   * ==========================================
   * EVALUATION
   * ==========================================
   */

  const submitEvaluation =
    async (
      siswaId: number,
      nilaiDUDI: number,
      nilaiGuru: number,
      period: string
    ) => {
      try {
        await Promise.all([
          api.post(
            '/api/evaluations',
            {
              studentId:
                siswaId,

              score:
                nilaiDUDI,

              type:
                'dudi',

              period,
            }
          ),

          api.post(
            '/api/evaluations',
            {
              studentId:
                siswaId,

              score:
                nilaiGuru,

              type:
                'guru',

              period,
            }
          ),
        ]);

        await loadSiswa();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal submit evaluasi'
        );
      }
    };

  /*
   * ==========================================
   * GURU GRADE
   * ==========================================
   */

  const submitGuruGrade =
    async (
      siswaId: number,
      nilaiGuru: number,
      period: string
    ) => {
      try {
        await api.post(
          '/api/evaluations',
          {
            studentId:
              siswaId,

            score:
              nilaiGuru,

            type:
              'guru',

            period,
          }
        );

        await loadSiswa();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal submit nilai guru'
        );
      }
    };

  /*
   * ==========================================
   * ADD SISWA
   * ==========================================
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
      await api.post(
        '/api/auth/register',
        {
          name:
            newSiswa.name,

          email:
            `${newSiswa.name
              .toLowerCase()
              .replace(
                /\s+/g,
                '.'
              )}@gopkl.id`,

          password:
            'gopkl123',

          academicYear:
            newSiswa.academicYear ||
            undefined,

          academicYearId:
            selectedAcademicYearId ||
            undefined,
        }
      );

      await loadSiswa();
    } catch (error: any) {
      throw new Error(
        error.message ||
        'Gagal menambah siswa'
      );
    }
  };

  /*
   * ==========================================
   * ADD PERUSAHAAN
   * ==========================================
   */

  const addPerusahaan =
    async (data: {
      name: string;
      address: string;
      quota: number;
      mentor: string;
    }) => {
      try {
        if (
          !selectedAcademicYearId
        ) {
          throw new Error(
            'Pilih Tahun Ajaran terlebih dahulu.'
          );
        }

        await api.post(
          '/api/companies',
          {
            name:
              data.name,

            address:
              data.address,

            quota:
              data.quota,

            academicYearId:
              selectedAcademicYearId,
          }
        );

        await loadPerusahaan();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal menambah perusahaan'
        );
      }
    };

  /*
   * ==========================================
   * UPDATE SISWA MAPPING
   * ==========================================
   */

  const updateSiswaMapping =
    async (
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
        await api.patch(
          `/api/users/${siswaId}`,
          {
            companyId:
              data.companyId
                ? Number(
                    data.companyId
                  )
                : undefined,

            teacherId:
              data.teacherId
                ? Number(
                    data.teacherId
                  )
                : undefined,

            mentorName:
              data.mentorName,

            academicYear:
              data.academicYear !==
              undefined
                ? data.academicYear
                : undefined,

            academicYearId:
              selectedAcademicYearId ||
              undefined,
          }
        );

        await loadSiswa();
        await loadGuru();
        await loadMentor();
        await loadPerusahaan();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal update pemetaan siswa'
        );
      }
    };

  /*
   * ==========================================
   * UPDATE COMPANY LOCATION
   * ==========================================
   */

  const updateCompanyLocation =
    async (
      companyId: number,
      lat: number,
      lng: number,
      radius: number
    ) => {
      try {
        await api.patch(
          `/api/companies/${companyId}`,
          {
            latitude:
              lat,

            longitude:
              lng,

            radiusMeters:
              radius,
          }
        );

        await loadPerusahaan();
      } catch (error: any) {
        throw new Error(
          error.message ||
          'Gagal update lokasi perusahaan'
        );
      }
    };

  /*
   * ==========================================
   * PROVIDER
   * ==========================================
   */

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

        loadSuperStats,
        loadSuperClasses,

        createClass,
        deleteClass,
        loadClassStudents,

        loadSuperUsers,

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

export const useApp = () => {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};