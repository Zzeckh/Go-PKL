import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Users,
  GraduationCap,
  ShieldCheck,
  Search,
  Trash2,
  ToggleRight,
  Loader2,
  X,
  Briefcase,
  KeyRound,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Archive,
  CheckSquare,
  Square,
  LogOut,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { api } from '../utils/api';

/* =========================================================
   HELPER
   ========================================================= */

const getInitials = (name: string) =>
  (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/* =========================================================
   TYPE
   ========================================================= */

type StatusFilter =
  | 'all'
  | 'active'
  | 'inactive';

type InactiveCategoryFilter =
  | 'all'
  | 'Alumni'
  | 'Keluar Sekolah';

type DeactivationType =
  | 'alumni'
  | 'keluar_sekolah';

type DeactivationStudent = {
  id: number;
  name: string;
  email: string;
  classId: number | null;
  class: string;
  major: string;
  academicYearId: number | null;
  academicYear: string;
};

/* =========================================================
   COMPONENT
   ========================================================= */

export const SuperUsers: React.FC = () => {
  const {
    superUsers,
    loadSuperUsers,
    deleteUser,
    updateUserRole,
    resetPassword,
    isAuthenticated,
  } = useApp();

  /* =======================================================
     FILTER UTAMA
     ======================================================= */

  const [roleFilter, setRoleFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  const [
    inactiveCategoryFilter,
    setInactiveCategoryFilter,
  ] =
    useState<InactiveCategoryFilter>('all');

  const [classFilter, setClassFilter] =
    useState('all');

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     PAGINATION
     ======================================================= */

  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] =
    useState(1);

  /* =======================================================
     RESET PASSWORD
     ======================================================= */

  const [
    resetModal,
    setResetModal,
  ] = useState<{
    userId: number;
    userName: string;
    newPassword: string;
  } | null>(null);

  const [resettingId, setResettingId] =
    useState<number | null>(null);

  const [copied, setCopied] =
    useState(false);

  /* =======================================================
     MODAL ALUMNI / KELUAR SEKOLAH
     ======================================================= */

  const [
    deactivationType,
    setDeactivationType,
  ] =
    useState<DeactivationType | null>(
      null
    );

  const [
    deactivationStudents,
    setDeactivationStudents,
  ] =
    useState<DeactivationStudent[]>([]);

  const [
    deactivationLoading,
    setDeactivationLoading,
  ] = useState(false);

  const [
    deactivationSearch,
    setDeactivationSearch,
  ] = useState('');

  const [
    deactivationClass,
    setDeactivationClass,
  ] = useState('all');

  const [
    selectedStudentIds,
    setSelectedStudentIds,
  ] = useState<number[]>([]);

  const [
    deactivating,
    setDeactivating,
  ] = useState(false);

  /* =======================================================
     LOAD USER
     ======================================================= */

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);

    loadSuperUsers({
      role: roleFilter,
      search,
    }).finally(() => {
      setLoading(false);
    });
  }, [
    isAuthenticated,
    loadSuperUsers,
    roleFilter,
    search,
  ]);

  /* =======================================================
     ROLE
     ======================================================= */

  const roles = [
    {
      key: 'all',
      label: 'Semua',
      icon: Users,
    },
    {
      key: 'student',
      label: 'Siswa',
      icon: GraduationCap,
    },
    {
      key: 'teacher',
      label: 'Guru',
      icon: Users,
    },
    {
      key: 'mentor',
      label: 'Mentor',
      icon: Briefcase,
    },
    {
      key: 'hubin',
      label: 'Hubin',
      icon: ShieldCheck,
    },
  ];

  /* =======================================================
     CLASS OPTIONS
     ======================================================= */

  const classOptions = useMemo(() => {
    const classes = superUsers
      .map((u: any) => u.class)
      .filter(
        (value: any) =>
          typeof value === 'string' &&
          value.trim() !== '' &&
          value !== '-'
      );

    return Array.from(
      new Set(classes)
    ).sort((a, b) =>
      a.localeCompare(b, 'id')
    );
  }, [superUsers]);

  /* =======================================================
     FILTER USER
     ======================================================= */

  const filteredUsers = useMemo(() => {
    return superUsers.filter(
      (user: any) => {
        /* -----------------------------------------------
           FILTER KELAS
           ----------------------------------------------- */

        const matchesClass =
          classFilter === 'all' ||
          (user.class || '-') ===
            classFilter;

        if (!matchesClass) {
          return false;
        }

        /* -----------------------------------------------
           FILTER STATUS
           ----------------------------------------------- */

        const matchesStatus =
          statusFilter === 'all' ||
          (
            statusFilter === 'active' &&
            user.isActive === true
          ) ||
          (
            statusFilter === 'inactive' &&
            user.isActive === false
          );

        if (!matchesStatus) {
          return false;
        }

        /* -----------------------------------------------
           FILTER KATEGORI NONAKTIF
           ----------------------------------------------- */

        if (
          statusFilter === 'inactive' &&
          inactiveCategoryFilter !== 'all'
        ) {
          return (
            user.inactiveCategory ===
            inactiveCategoryFilter
          );
        }

        return true;
      }
    );
  }, [
    superUsers,
    classFilter,
    statusFilter,
    inactiveCategoryFilter,
  ]);

  /* =======================================================
     PAGINATION
     ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedUsers = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredUsers.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [
    filteredUsers,
    currentPage,
  ]);

  const startItem =
    filteredUsers.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endItem = Math.min(
    currentPage *
      ITEMS_PER_PAGE,
    filteredUsers.length
  );

  /* =======================================================
     RESET PAGE
     ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    roleFilter,
    statusFilter,
    inactiveCategoryFilter,
    classFilter,
    search,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  /* =======================================================
     PAGE NUMBERS
     ======================================================= */

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    if (totalPages <= 5) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }
    } else if (
      currentPage <= 3
    ) {
      pages.push(
        1,
        2,
        3,
        4,
        5
      );
    } else if (
      currentPage >=
      totalPages - 2
    ) {
      pages.push(
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        currentPage - 2,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2
      );
    }

    return pages;
  }, [
    currentPage,
    totalPages,
  ]);

  /* =======================================================
     OPEN ALUMNI / KELUAR SEKOLAH
     ======================================================= */

  const openDeactivation = async (
    type: DeactivationType
  ) => {
    setDeactivationType(type);

    setDeactivationSearch('');

    setDeactivationClass('all');

    setSelectedStudentIds([]);

    setDeactivationLoading(true);

    try {
      const params =
        new URLSearchParams();

      params.set(
        'type',
        type
      );

      const result =
        (await api.get(
          `/api/super-admin/deactivation-students?${params.toString()}`
        )) as DeactivationStudent[];

      setDeactivationStudents(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.error ||
          error?.data?.error ||
          error?.message ||
          'Gagal mengambil daftar siswa.'
      );

      setDeactivationType(null);
    } finally {
      setDeactivationLoading(
        false
      );
    }
  };

  /* =======================================================
     CLOSE MODAL
     ======================================================= */

  const closeDeactivation =
    () => {
      if (deactivating) return;

      setDeactivationType(null);

      setDeactivationStudents([]);

      setSelectedStudentIds([]);

      setDeactivationSearch('');

      setDeactivationClass('all');
    };

  /* =======================================================
     CLASS OPTIONS MODAL
     ======================================================= */

  const deactivationClassOptions =
    useMemo(() => {
      const classes =
        deactivationStudents
          .map(
            student =>
              student.class
          )
          .filter(
            value =>
              value &&
              value !== '-'
          );

      return Array.from(
        new Set(classes)
      ).sort((a, b) =>
        a.localeCompare(
          b,
          'id'
        )
      );
    }, [
      deactivationStudents,
    ]);

  /* =======================================================
     FILTER MODAL
     ======================================================= */

  const filteredDeactivationStudents =
    useMemo(() => {
      const keyword =
        deactivationSearch
          .trim()
          .toLowerCase();

      return deactivationStudents.filter(
        student => {
          const matchesSearch =
            !keyword ||
            student.name
              .toLowerCase()
              .includes(keyword) ||
            student.email
              .toLowerCase()
              .includes(keyword);

          const matchesClass =
            deactivationClass ===
              'all' ||
            student.class ===
              deactivationClass;

          return (
            matchesSearch &&
            matchesClass
          );
        }
      );
    }, [
      deactivationStudents,
      deactivationSearch,
      deactivationClass,
    ]);

  /* =======================================================
     SELECT STUDENT
     ======================================================= */

  const toggleStudentSelection =
    (id: number) => {
      setSelectedStudentIds(
        current => {
          if (
            current.includes(id)
          ) {
            return current.filter(
              item =>
                item !== id
            );
          }

          return [
            ...current,
            id,
          ];
        }
      );
    };

  /* =======================================================
     SELECT ALL FILTERED
     ======================================================= */

  const allFilteredSelected =
    filteredDeactivationStudents.length >
      0 &&
    filteredDeactivationStudents.every(
      student =>
        selectedStudentIds.includes(
          student.id
        )
    );

  const toggleSelectAll =
    () => {
      const ids =
        filteredDeactivationStudents.map(
          student =>
            student.id
        );

      if (
        allFilteredSelected
      ) {
        setSelectedStudentIds(
          current =>
            current.filter(
              id =>
                !ids.includes(id)
            )
        );
      } else {
        setSelectedStudentIds(
          current =>
            Array.from(
              new Set([
                ...current,
                ...ids,
              ])
            )
        );
      }
    };

  /* =======================================================
     NONAKTIFKAN SISWA
     ======================================================= */

  const deactivateStudents =
    async (
      ids: number[]
    ) => {
      if (
        !deactivationType ||
        ids.length === 0
      ) {
        return;
      }

      const category =
        deactivationType ===
        'alumni'
          ? 'Alumni'
          : 'Keluar Sekolah';

      const response =
        (await api.post(
          '/api/super-admin/deactivate-students',
          {
            userIds: ids,
            category,
            reason: category,
          }
        )) as any;

      return response;
    };

  /* =======================================================
     NONAKTIFKAN TERPILIH
     ======================================================= */

  const handleDeactivateSelected =
    async () => {
      if (
        selectedStudentIds.length ===
        0
      ) {
        alert(
          'Pilih minimal satu siswa.'
        );
        return;
      }

      const category =
        deactivationType ===
        'alumni'
          ? 'Alumni'
          : 'Keluar Sekolah';

      const confirmed =
        window.confirm(
          `Nonaktifkan ${selectedStudentIds.length} siswa sebagai ${category}?`
        );

      if (!confirmed) return;

      setDeactivating(true);

      try {
        const response =
          await deactivateStudents(
            selectedStudentIds
          );

        alert(
          response?.message ||
            `${selectedStudentIds.length} siswa berhasil dinonaktifkan sebagai ${category}.`
        );

        await loadSuperUsers({
          role: roleFilter,
          search,
        });

        await openDeactivation(
          deactivationType!
        );
      } catch (error: any) {
        alert(
          error?.response?.data?.error ||
            error?.data?.error ||
            error?.message ||
            'Gagal menonaktifkan siswa.'
        );
      } finally {
        setDeactivating(false);
      }
    };

  /* =======================================================
     NONAKTIFKAN SEMUA HASIL FILTER
     ======================================================= */

  const handleDeactivateAll =
    async () => {
      const ids =
        filteredDeactivationStudents.map(
          student =>
            student.id
        );

      if (ids.length === 0) {
        alert(
          'Tidak ada siswa yang sesuai dengan filter.'
        );
        return;
      }

      const category =
        deactivationType ===
        'alumni'
          ? 'Alumni'
          : 'Keluar Sekolah';

      const confirmed =
        window.confirm(
          `Yakin ingin menonaktifkan SEMUA ${ids.length} siswa yang sedang sesuai filter sebagai ${category}?\n\nHanya siswa yang tampil berdasarkan pencarian dan filter kelas yang diproses.`
        );

      if (!confirmed) return;

      setDeactivating(true);

      try {
        const response =
          await deactivateStudents(
            ids
          );

        alert(
          response?.message ||
            `${ids.length} siswa berhasil dinonaktifkan sebagai ${category}.`
        );

        await loadSuperUsers({
          role: roleFilter,
          search,
        });

        await openDeactivation(
          deactivationType!
        );
      } catch (error: any) {
        alert(
          error?.response?.data?.error ||
            error?.data?.error ||
            error?.message ||
            'Gagal menonaktifkan siswa.'
        );
      } finally {
        setDeactivating(false);
      }
    };

  /* =======================================================
     AKTIFKAN KEMBALI
     ======================================================= */

  const handleActivate =
    async (
      userId: number,
      userName: string
    ) => {
      const confirmed =
        window.confirm(
          `Aktifkan kembali "${userName}"?`
        );

      if (!confirmed) return;

      try {
        await api.patch(
          `/api/super-admin/users/${userId}/activate`
        );

        await loadSuperUsers({
          role: roleFilter,
          search,
        });

        alert(
          `"${userName}" berhasil diaktifkan kembali.`
        );
      } catch (error: any) {
        alert(
          error?.response?.data?.error ||
            error?.data?.error ||
            error?.message ||
            'Gagal mengaktifkan user.'
        );
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>

            <div>

              <h2 className="font-bold text-lg md:text-xl text-navy">
                Kelola Pengguna
              </h2>

              <p className="text-[13px] text-navy/60 font-semibold">
                {filteredUsers.length} user ditemukan
              </p>

            </div>

          </div>

          {/* ================================================
              TOMBOL ALUMNI / KELUAR SEKOLAH
              ================================================ */}

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() =>
                openDeactivation(
                  'alumni'
                )
              }
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-xs font-bold hover:bg-steel transition-all shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />

              Alumni
            </button>

            <button
              onClick={() =>
                openDeactivation(
                  'keluar_sekolah'
                )
              }
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-mist text-navy rounded-xl text-xs font-bold hover:bg-mist/40 transition-all"
            >
              <LogOut className="w-4 h-4" />

              Keluar Sekolah
            </button>

          </div>

        </div>

      </div>

      {/* ===================================================
          ROLE FILTER
          =================================================== */}

      <div className="shrink-0">

        <div className="bg-mist/40 p-1 rounded-[24px] flex gap-1 overflow-x-auto">

          {roles.map(role => {
            const Icon =
              role.icon;

            const active =
              roleFilter ===
              role.key;

            return (
              <button
                key={role.key}
                onClick={() =>
                  setRoleFilter(
                    role.key
                  )
                }
                className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-navy text-white shadow'
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />

                {role.label}
              </button>
            );
          })}

        </div>

      </div>

      {/* ===================================================
          STATUS FILTER
          =================================================== */}

      <div className="shrink-0 flex flex-wrap gap-2">

        {/* SEMUA */}

        <button
          onClick={() => {
            setStatusFilter(
              'all'
            );

            setInactiveCategoryFilter(
              'all'
            );
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-navy text-white shadow'
              : 'bg-mist/40 text-navy/60 hover:text-navy'
          }`}
        >
          Semua
        </button>

        {/* AKTIF */}

        <button
          onClick={() => {
            setStatusFilter(
              'active'
            );

            setInactiveCategoryFilter(
              'all'
            );
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            statusFilter ===
            'active'
              ? 'bg-steel text-white shadow'
              : 'bg-mist/40 text-navy/60 hover:text-navy'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />

          Aktif
        </button>

        {/* NONAKTIF */}

        <button
          onClick={() => {
            setStatusFilter(
              'inactive'
            );

            setInactiveCategoryFilter(
              'all'
            );
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            statusFilter ===
            'inactive'
              ? 'bg-amber-500 text-white shadow'
              : 'bg-mist/40 text-navy/60 hover:text-navy'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />

          Nonaktif
        </button>

      </div>

      {/* ===================================================
          FILTER KATEGORI NONAKTIF
          HANYA MUNCUL SAAT NONAKTIF
          =================================================== */}

      {statusFilter ===
        'inactive' && (

        <div className="shrink-0 flex flex-wrap items-center gap-2">

          <span className="text-[11px] font-bold text-navy/40">
            Kategori:
          </span>

          {/* SEMUA NONAKTIF */}

          <button
            onClick={() =>
              setInactiveCategoryFilter(
                'all'
              )
            }
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              inactiveCategoryFilter ===
              'all'
                ? 'bg-navy text-white'
                : 'bg-mist/40 text-navy/60 hover:text-navy'
            }`}
          >
            Semua Nonaktif
          </button>

          {/* ALUMNI */}

          <button
            onClick={() =>
              setInactiveCategoryFilter(
                'Alumni'
              )
            }
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              inactiveCategoryFilter ===
              'Alumni'
                ? 'bg-navy text-white'
                : 'bg-mist/40 text-navy/60 hover:text-navy'
            }`}
          >
            <GraduationCap className="w-3 h-3" />

            Alumni
          </button>

          {/* KELUAR SEKOLAH */}

          <button
            onClick={() =>
              setInactiveCategoryFilter(
                'Keluar Sekolah'
              )
            }
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              inactiveCategoryFilter ===
              'Keluar Sekolah'
                ? 'bg-navy text-white'
                : 'bg-mist/40 text-navy/60 hover:text-navy'
            }`}
          >
            <LogOut className="w-3 h-3" />

            Keluar Sekolah
          </button>

        </div>
      )}

      {/* ===================================================
          SEARCH + KELAS
          =================================================== */}

      <div className="shrink-0 flex flex-col md:flex-row gap-2">

        {/* SEARCH */}

        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />

          <input
            type="text"
            value={search}
            onChange={e =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Cari nama atau email..."
            className="w-full bg-mist/40 border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
          />

          {search && (
            <button
              onClick={() =>
                setSearch('')
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-navy/60" />
            </button>
          )}

        </div>

        {/* KELAS */}

        <div className="md:w-56">

          <select
            value={classFilter}
            onChange={e =>
              setClassFilter(
                e.target.value
              )
            }
            className="w-full min-h-[42px] bg-mist/40 border border-mist rounded-[24px] px-4 py-2.5 text-sm font-bold text-navy outline-none focus:border-steel focus:bg-white cursor-pointer"
          >

            <option value="all">
              Semua Kelas
            </option>

            {classOptions.map(
              className => (
                <option
                  key={className}
                  value={className}
                >
                  {className}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* ===================================================
          USER LIST
          =================================================== */}

      <div className="lg:flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col lg:min-h-0">

        <div className="lg:flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 max-h-[65vh] lg:max-h-none">

          {loading ? (

            <div className="flex items-center justify-center h-40">

              <div className="flex items-center gap-2 text-navy/60">

                <Loader2 className="w-5 h-5 animate-spin text-steel" />

                <span className="text-sm font-semibold">
                  Memuat data...
                </span>

              </div>

            </div>

          ) : filteredUsers.length ===
            0 ? (

            <div className="flex flex-col items-center justify-center py-16 text-center">

              <Users className="w-10 h-10 text-navy/20 mb-3" />

              <p className="text-sm font-bold text-navy">
                User tidak ditemukan
              </p>

              <p className="text-xs text-navy/50 mt-1">
                Tidak ada user yang sesuai dengan filter.
              </p>

            </div>

          ) : (

            <div className="space-y-2">

              {paginatedUsers.map(
                (user: any) => (

                  <div
                    key={user.id}
                    className="p-3 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3 hover:border-steel/30 hover:shadow-sm transition-all"
                  >

                    {/* AVATAR */}

                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(
                        user.name
                      )}
                    </div>

                    {/* INFO */}

                    <div className="flex-1 min-w-0">

                      <p className="text-[13px] font-bold text-navy truncate">
                        {user.name}
                      </p>

                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {user.email}
                        {' · '}
                        {user.class ||
                          '-'}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">

                        {/* STATUS */}

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            user.isActive
                              ? 'bg-steel text-white'
                              : 'bg-navy text-white'
                          }`}
                        >
                          {user.isActive
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </span>

                        {/* ROLE */}

                        <span className="text-[10px] font-bold bg-white text-navy/70 border border-mist/60 px-2.5 py-1 rounded-full uppercase">
                          {String(
                            user.role
                          ).replace(
                            '_',
                            ' '
                          )}
                        </span>

                        {/* KATEGORI */}

                        {!user.isActive &&
                          user.inactiveCategory && (

                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                            {
                              user.inactiveCategory
                            }
                          </span>

                        )}

                      </div>

                    </div>

                    {/* ACTION */}

                    {user.role !==
                      'super_admin' && (

                      <div className="flex items-center gap-1.5 shrink-0">

                        {/* ROLE */}

                        <select
                          value={
                            user.role
                          }
                          onChange={async e => {

                            const role =
                              e.target
                                .value;

                            if (
                              !window.confirm(
                                `Ubah role "${user.name}" menjadi ${role}?`
                              )
                            ) {
                              return;
                            }

                            try {
                              await updateUserRole(
                                user.id,
                                role
                              );
                            } catch (
                              error: any
                            ) {
                              alert(
                                error?.response?.data?.error ||
                                  error?.data?.error ||
                                  error?.message ||
                                  'Gagal mengubah role.'
                              );
                            }

                          }}
                          className="h-9 bg-white border border-mist/60 rounded-lg px-2 text-xs font-bold text-navy outline-none cursor-pointer"
                        >

                          <option value="student">
                            Siswa
                          </option>

                          <option value="teacher">
                            Guru
                          </option>

                          <option value="mentor">
                            Mentor
                          </option>

                          <option value="hubin">
                            Hubin
                          </option>

                        </select>

                        {/* RESET PASSWORD */}

                        <button
                          onClick={async () => {

                            if (
                              !window.confirm(
                                `Reset password "${user.name}"?`
                              )
                            ) {
                              return;
                            }

                            setResettingId(
                              user.id
                            );

                            try {

                              const result =
                                await resetPassword(
                                  user.id
                                );

                              setResetModal(
                                {
                                  userId:
                                    result.id,
                                  userName:
                                    result.name,
                                  newPassword:
                                    result.newPassword,
                                }
                              );

                            } catch (
                              error: any
                            ) {

                              alert(
                                error?.response?.data?.error ||
                                  error?.data?.error ||
                                  error?.message ||
                                  'Gagal mereset password.'
                              );

                            } finally {

                              setResettingId(
                                null
                              );

                            }

                          }}
                          className="w-9 h-9 rounded-lg bg-white border border-mist/60 text-navy/50 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center"
                        >

                          {resettingId ===
                          user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <KeyRound className="w-4 h-4" />
                          )}

                        </button>

                        {/* DELETE */}

                        <button
                          onClick={async () => {

                            if (
                              !window.confirm(
                                `Hapus pengguna "${user.name}"?`
                              )
                            ) {
                              return;
                            }

                            try {

                              await deleteUser(
                                user.id
                              );

                            } catch (
                              error: any
                            ) {

                              alert(
                                error?.response?.data?.error ||
                                  error?.data?.error ||
                                  error?.message ||
                                  'Gagal menghapus user.'
                              );

                            }

                          }}
                          className="w-9 h-9 rounded-lg bg-white border border-mist/60 text-navy/50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* AKTIF / NONAKTIF */}

                        {user.isActive ? (

                          <button
                            onClick={() =>
                              user.role ===
                              'student'
                                ? openDeactivation(
                                    'alumni'
                                  )
                                : undefined
                            }
                            className="w-9 h-9 rounded-lg bg-white border border-mist/60 text-navy/50 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center"
                            title={
                              user.role ===
                              'student'
                                ? 'Kelola nonaktif siswa'
                                : 'Nonaktifkan'
                            }
                          >
                            <UserX className="w-4 h-4" />
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              handleActivate(
                                user.id,
                                user.name
                              )
                            }
                            className="w-9 h-9 rounded-lg bg-white border border-mist/60 text-steel hover:bg-mist/30 flex items-center justify-center"
                            title="Aktifkan kembali"
                          >
                            <ToggleRight className="w-4 h-4" />
                          </button>

                        )}

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* =================================================
            PAGINATION
            ================================================= */}

        {!loading &&
          filteredUsers.length >
            0 && (

          <div className="border-t border-mist/60 px-4 md:px-5 py-3 bg-white shrink-0">

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

              <p className="text-[11px] font-semibold text-navy/50">

                Menampilkan{' '}

                <b className="text-navy">
                  {startItem}
                </b>

                {' - '}

                <b className="text-navy">
                  {endItem}
                </b>

                {' dari '}

                <b className="text-navy">
                  {filteredUsers.length}
                </b>

                {' user'}

              </p>

              <div className="flex items-center gap-1.5">

                <button
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      page =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="w-9 h-9 rounded-lg border border-mist flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map(
                  page => (

                    <button
                      key={page}
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`w-9 h-9 rounded-lg text-xs font-bold ${
                        currentPage ===
                        page
                          ? 'bg-navy text-white'
                          : 'border border-mist text-navy/60'
                      }`}
                    >
                      {page}
                    </button>

                  )
                )}

                <button
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      page =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="w-9 h-9 rounded-lg border border-mist flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* ===================================================
          MODAL ALUMNI / KELUAR SEKOLAH
          =================================================== */}

      {deactivationType && (

        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">

          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden">

            {/* HEADER */}

            <div className="p-5 md:p-6 border-b border-mist/60 shrink-0">

              <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-[12px] bg-navy text-white flex items-center justify-center">

                    {deactivationType ===
                    'alumni' ? (
                      <GraduationCap className="w-5 h-5" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}

                  </div>

                  <div>

                    <h3 className="font-bold text-lg text-navy">

                      {deactivationType ===
                      'alumni'
                        ? 'Alumni'
                        : 'Keluar Sekolah'}

                    </h3>

                    <p className="text-xs text-navy/50 font-semibold">

                      Pilih siswa yang akan dinonaktifkan.

                    </p>

                  </div>

                </div>

                <button
                  onClick={
                    closeDeactivation
                  }
                  disabled={
                    deactivating
                  }
                  className="w-9 h-9 rounded-full bg-mist/40 hover:bg-mist flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-navy/60" />
                </button>

              </div>

            </div>

            {/* FILTER */}

            <div className="p-4 md:p-5 border-b border-mist/60 shrink-0 space-y-3">

              <div className="flex flex-col md:flex-row gap-2">

                {/* SEARCH */}

                <div className="relative flex-1">

                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />

                  <input
                    type="text"
                    value={
                      deactivationSearch
                    }
                    onChange={e =>
                      setDeactivationSearch(
                        e.target.value
                      )
                    }
                    placeholder="Cari siswa..."
                    className="w-full bg-mist/40 border border-mist rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-steel"
                  />

                </div>

                {/* KELAS */}

                <select
                  value={
                    deactivationClass
                  }
                  onChange={e =>
                    setDeactivationClass(
                      e.target.value
                    )
                  }
                  className="md:w-56 bg-mist/40 border border-mist rounded-2xl px-4 py-2.5 text-sm font-bold text-navy outline-none"
                >

                  <option value="all">
                    Semua Kelas
                  </option>

                  {deactivationClassOptions.map(
                    className => (
                      <option
                        key={
                          className
                        }
                        value={
                          className
                        }
                      >
                        {className}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* SELECT ALL */}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                <button
                  onClick={
                    toggleSelectAll
                  }
                  disabled={
                    deactivationLoading ||
                    filteredDeactivationStudents.length ===
                      0
                  }
                  className="flex items-center gap-2 text-xs font-bold text-navy hover:text-steel disabled:opacity-40"
                >

                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}

                  {allFilteredSelected
                    ? 'Batalkan Semua Pilihan'
                    : 'Pilih Semua Hasil Filter'}

                </button>

                <p className="text-xs font-semibold text-navy/50">

                  {filteredDeactivationStudents.length}{' '}
                  siswa ditemukan ·{' '}

                  <span className="text-navy font-bold">
                    {
                      selectedStudentIds.length
                    }
                  </span>{' '}
                  dipilih

                </p>

              </div>

            </div>

            {/* LIST */}

            <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">

              {deactivationLoading ? (

                <div className="h-60 flex items-center justify-center">

                  <div className="flex items-center gap-2 text-navy/60">

                    <Loader2 className="w-5 h-5 animate-spin text-steel" />

                    <span className="text-sm font-semibold">
                      Memuat daftar siswa...
                    </span>

                  </div>

                </div>

              ) : filteredDeactivationStudents.length ===
                0 ? (

                <div className="h-60 flex flex-col items-center justify-center text-center">

                  <Users className="w-10 h-10 text-navy/20 mb-3" />

                  <p className="text-sm font-bold text-navy">
                    Siswa tidak ditemukan
                  </p>

                  <p className="text-xs text-navy/50 mt-1">
                    Coba ubah pencarian atau filter kelas.
                  </p>

                </div>

              ) : (

                <div className="space-y-2">

                  {filteredDeactivationStudents.map(
                    student => {

                      const selected =
                        selectedStudentIds.includes(
                          student.id
                        );

                      return (
                        <button
                          key={
                            student.id
                          }
                          type="button"
                          onClick={() =>
                            toggleStudentSelection(
                              student.id
                            )
                          }
                          className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                            selected
                              ? 'border-steel bg-steel/5 shadow-sm'
                              : 'border-mist/60 bg-white hover:bg-mist/30'
                          }`}
                        >

                          {/* CHECKBOX */}

                          <div
                            className={`shrink-0 ${
                              selected
                                ? 'text-steel'
                                : 'text-navy/20'
                            }`}
                          >

                            {selected ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}

                          </div>

                          {/* AVATAR */}

                          <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">

                            {getInitials(
                              student.name
                            )}

                          </div>

                          {/* DATA */}

                          <div className="min-w-0 flex-1">

                            <p className="text-sm font-bold text-navy truncate">

                              {student.name}

                            </p>

                            <p className="text-[11px] text-navy/50 font-semibold truncate">

                              {student.email}

                            </p>

                          </div>

                          <div className="hidden sm:flex flex-col items-end shrink-0">

                            <span className="text-[11px] font-bold text-navy">

                              {student.class}

                            </span>

                            <span className="text-[10px] text-navy/40 font-semibold">

                              {student.major}

                            </span>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="p-4 md:p-5 border-t border-mist/60 shrink-0 bg-white">

              <div className="flex flex-col sm:flex-row gap-2">

                {/* TERPILIH */}

                <button
                  type="button"
                  onClick={
                    handleDeactivateSelected
                  }
                  disabled={
                    deactivating ||
                    selectedStudentIds.length ===
                      0
                  }
                  className="flex-1 py-3 rounded-2xl bg-navy text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-navy/20 disabled:cursor-not-allowed hover:bg-steel transition-all"
                >

                  {deactivating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}

                  Nonaktifkan Terpilih

                  {selectedStudentIds.length >
                    0 &&
                    ` (${selectedStudentIds.length})`}

                </button>

                {/* SEMUA */}

                <button
                  type="button"
                  onClick={
                    handleDeactivateAll
                  }
                  disabled={
                    deactivating ||
                    filteredDeactivationStudents.length ===
                      0
                  }
                  className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-amber-200 disabled:cursor-not-allowed hover:bg-amber-600 transition-all"
                >

                  <Archive className="w-4 h-4" />

                  Nonaktifkan Semua

                  {filteredDeactivationStudents.length >
                    0 &&
                    ` (${filteredDeactivationStudents.length})`}

                </button>

                {/* BATAL */}

                <button
                  type="button"
                  onClick={
                    closeDeactivation
                  }
                  disabled={
                    deactivating
                  }
                  className="sm:w-28 py-3 rounded-2xl bg-white border border-mist text-navy text-sm font-bold hover:bg-mist/30"
                >
                  Batal
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          RESET PASSWORD
          =================================================== */}

      {resetModal && (

        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-[24px] p-5 md:p-6 w-full max-w-sm shadow-xl">

            <div className="flex items-center justify-between mb-4">

              <h3 className="font-bold text-navy">
                Password Baru
              </h3>

              <button
                onClick={() =>
                  setResetModal(null)
                }
                className="w-8 h-8 rounded-full bg-mist/40 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="bg-mist/40 border border-mist rounded-2xl p-4 mb-4">

              <p className="text-xs text-navy/50 font-semibold mb-2">

                Password baru untuk{' '}

                <b className="text-navy">
                  {
                    resetModal.userName
                  }
                </b>

              </p>

              <div className="flex gap-2">

                <div className="flex-1 bg-white border border-mist rounded-xl px-3 py-2 font-mono font-bold text-sm select-all">

                  {
                    resetModal.newPassword
                  }

                </div>

                <button
                  onClick={() => {

                    navigator.clipboard.writeText(
                      resetModal.newPassword
                    );

                    setCopied(true);

                    setTimeout(
                      () =>
                        setCopied(
                          false
                        ),
                      2000
                    );

                  }}
                  className="w-10 h-10 rounded-xl border border-mist flex items-center justify-center"
                >

                  {copied ? (
                    <Check className="w-4 h-4 text-steel" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}

                </button>

              </div>

              <p className="text-[10px] text-navy/40 font-semibold mt-2">
                Simpan password ini sebelum menutup.
              </p>

            </div>

            <button
              onClick={() =>
                setResetModal(null)
              }
              className="w-full py-2.5 bg-navy text-white rounded-2xl font-bold text-sm"
            >
              Tutup
            </button>

          </div>

        </div>

      )}

    </div>
  );
};  