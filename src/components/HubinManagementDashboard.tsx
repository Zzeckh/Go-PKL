import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Clock,
  ChevronRight,
  AlertCircle,
  BookMarked,
  Loader2,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DashboardCharts } from './DashboardCharts';

const getInitials = (name: string) =>
  (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/* ══════════════════════════════════════════════════════
   DASHBOARD HUBIN
   ══════════════════════════════════════════════════════ */

export const HubinManagementDashboard: React.FC<{
  userName: string;
  onNavigate: (page: any) => void;
}> = ({ userName, onNavigate }) => {
  const {
    superStats,
    loadSuperStats,

    superClasses,
    loadHubinClasses,
    siswaList,

    isAuthenticated,

    academicYears,
    selectedAcademicYearId,
    setSelectedAcademicYearId,
  } = useApp();

  const [statsState, setStatsState] = useState<
    'loading' | 'ready' | 'error'
  >('loading');

  const [time, setTime] = useState(new Date());
  const [selectedTefaView, setSelectedTefaView] = useState<'internal' | 'external' | null>(null);
  const [tefaTableSearch, setTefaTableSearch] = useState('');


  /* ============================================================
     JAM REALTIME
  ============================================================ */

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(t);
  }, []);

  /* ============================================================
     LOAD DATA DASHBOARD
  ============================================================ */

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const run = async (attempt = 0) => {
      setStatsState('loading');

      const ok = await loadSuperStats();

      if (cancelled) return;

      if (ok) {
        setStatsState('ready');
      } else if (attempt < 2) {
        setTimeout(() => {
          run(attempt + 1);
        }, 700);
      } else {
        setStatsState('error');
      }
    };

    run();

    loadHubinClasses();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    loadSuperStats,
    loadHubinClasses,
    selectedAcademicYearId,
  ]);

  /* ============================================================
     PILIH TAHUN AJARAN
  ============================================================ */

  const handleAcademicYearChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;

    if (!value) {
      return;
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    setSelectedAcademicYearId(id);
  };

  /* ============================================================
     DISTRIBUSI ROLE
  ============================================================ */

  const roleRows = [
    {
      icon: GraduationCap,
      label: 'Siswa',
      value: superStats?.totalStudents ?? 0,
    },
    {
      icon: Users,
      label: 'Guru',
      value: superStats?.totalTeachers ?? 0,
    },
    {
      icon: Users,
      label: 'Mentor',
      value: superStats?.totalMentors ?? 0,
    },
    {
      icon: ShieldCheck,
      label: 'Hubin',
      value: superStats?.totalHubins ?? 0,
    },
  ];

  const totalUsers = roleRows.reduce(
    (s, r) => s + r.value,
    0
  );

  /* ============================================================
     QUICK STATS
  ============================================================ */

  const quickStats = [
    {
      icon: CheckCircle2,
      label: 'Absensi',
      value: superStats?.totalAbsensi ?? 0,
    },
    {
      icon: BookOpen,
      label: 'Logbook',
      value: superStats?.totalLogbooks ?? 0,
    },
    {
      icon: FileCheck,
      label: 'Perizinan',
      value: superStats?.totalPermissions ?? 0,
    },
  ];

  /* ============================================================
     PERLU PERHATIAN
  ============================================================ */

  const attention = [
    ...superClasses
      .filter(
        (c) =>
          (c.totalStudents ?? 0) === 0
      )
      .map((c) => ({
        key: `cls-${c.id}`,
        icon: BookMarked,
        tint: 'mist',
        title: c.name,
        desc: 'Belum ada siswa terdaftar',
        page: 'hubin-classes',
      })),
  ].slice(0, 5);

  /* ============================================================
     SELECTED ACADEMIC YEAR
  ============================================================ */

  const selectedAcademicYear =
    academicYears?.find(
      (year) =>
        year.id === selectedAcademicYearId
    );

  const yearScopedStudents = useMemo(
    () =>
      siswaList.filter(
        (student) =>
          !selectedAcademicYearId ||
          Number(student.academicYearId) === Number(selectedAcademicYearId)
      ),
    [siswaList, selectedAcademicYearId]
  );

  const mappedStudents = useMemo(
    () =>
      yearScopedStudents.filter((student) => {
        const category = student.tefaCategory;
        const hasCompany = Boolean(
          student.perusahaan && student.perusahaan.trim() && student.perusahaan !== '-'
        );
        return category === 'internal' || (category === 'external' && hasCompany) || hasCompany;
      }),
    [yearScopedStudents]
  );

  const totalTefaInternal = yearScopedStudents.filter(
    (student) => student.tefaCategory === 'internal'
  ).length;

  const totalTefaEksternal = yearScopedStudents.filter(
    (student) => student.tefaCategory === 'external'
  ).length;

  const tefaTableStudents = useMemo(() => {
    if (!selectedTefaView) return [];
    const query = tefaTableSearch.trim().toLowerCase();
    return yearScopedStudents.filter((student) => {
      if (student.tefaCategory !== selectedTefaView) return false;
      if (!query) return true;
      return (
        (student.name || '').toLowerCase().includes(query) ||
        (student.kelas || '').toLowerCase().includes(query) ||
        (student.perusahaan || '').toLowerCase().includes(query) ||
        (student.guruPembimbing || '').toLowerCase().includes(query) ||
        (student.mentor || '').toLowerCase().includes(query)
      );
    });
  }, [yearScopedStudents, selectedTefaView, tefaTableSearch]);

  /* ============================================================
     MAIN STATS
  ============================================================ */
  const stats = [
    {
      icon: GraduationCap,
      label: 'Siswa yang Terpetakan',
      value: mappedStudents.length,
      page: 'pemetaan',
      tefaView: null,
    },
    {
      icon: BookOpen,
      label: 'TEFA Internal',
      value: totalTefaInternal,
      page: 'pemetaan',
      tefaView: 'internal' as const,
    },
    {
      icon: Building2,
      label: 'TEFA Eksternal',
      value: totalTefaEksternal,
      page: 'pemetaan',
      tefaView: 'external' as const,
    },
    {
      icon: Users,
      label: 'Total Pembimbing',
      value:
        (superStats?.totalTeachers ?? 0) +
        (superStats?.totalMentors ?? 0),
      page: 'hubin-users',
      tefaView: null,
    },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">

        {/* LEFT HEADER */}

        <div className="flex items-center gap-3 md:gap-4 min-w-0">

          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Ringkasan Pengelolaan Hubin
            </h2>

            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Ringkasan data kelas, pengguna, dan aktivitas PKL
            </p>
          </div>
        </div>

        {/* RIGHT HEADER */}

        <div className="flex items-center gap-2 shrink-0 flex-wrap">

          {/* TAHUN AJARAN */}

          <div className="relative">

            <div className="flex items-center gap-2 bg-white border border-mist shadow-sm px-3 py-2 rounded-full">

              <CalendarDays className="w-3.5 h-3.5 text-steel shrink-0" />

              <select
                value={
                  selectedAcademicYearId
                    ? String(selectedAcademicYearId)
                    : ''
                }
                onChange={
                  handleAcademicYearChange
                }
                disabled={
                  !academicYears ||
                  academicYears.length === 0
                }
                className="appearance-none bg-transparent outline-none border-none text-[11px] font-bold text-navy cursor-pointer pr-1"
              >
                {academicYears &&
                academicYears.length > 0 ? (
                  academicYears.map(
                    (year) => (
                      <option
                        key={year.id}
                        value={year.id}
                      >
                        {year.name}
                        {year.isActive
                          ? ' • Aktif'
                          : ''}
                      </option>
                    )
                  )
                ) : (
                  <option value="">
                    Memuat tahun ajaran...
                  </option>
                )}
              </select>

            </div>

          </div>

          {/* TANGGAL */}

          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-mist/40 border border-mist px-3 py-2 rounded-full">

            <Clock className="w-3.5 h-3.5" />

            {time.toLocaleDateString(
              'id-ID',
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }
            )}

          </span>

          {/* SYSTEM ONLINE */}

          <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-white border border-steel/30 shadow-sm px-3 py-2 rounded-full">

            <span className="relative flex h-2 w-2">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-40" />

              <span className="relative inline-flex rounded-full h-2 w-2 bg-steel" />

            </span>

            System Online

          </span>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CURRENT YEAR INFO
      ══════════════════════════════════════════════════════ */}

      {selectedAcademicYear && (
        <div className="shrink-0 bg-navy/5 border border-navy/10 rounded-[20px] px-4 py-3 flex items-center justify-between gap-3">

          <div className="flex items-center gap-2.5 min-w-0">

            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>

            <div className="min-w-0">

              <p className="text-[10px] font-bold uppercase tracking-widest text-navy/50">
                Data Dashboard
              </p>

              <p className="text-sm font-bold text-navy truncate">
                Tahun Ajaran {selectedAcademicYear.name}
              </p>

            </div>

          </div>

          {selectedAcademicYear.isActive && (
            <span className="shrink-0 text-[10px] font-bold bg-steel text-white px-2.5 py-1 rounded-full">
              Aktif
            </span>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ERROR
      ══════════════════════════════════════════════════════ */}

      {statsState === 'error' && (
        <div className="shrink-0 bg-navy/5 border border-navy/15 rounded-[24px] p-4 flex items-center justify-between gap-3">

          <div className="flex items-center gap-2.5 min-w-0">

            <AlertCircle className="w-4 h-4 text-navy/60 shrink-0" />

            <p className="text-[12px] font-semibold text-navy leading-snug">
              Gagal memuat statistik. Periksa terminal backend, lalu coba lagi.
            </p>

          </div>

          <button
            onClick={() => {
              setStatsState('loading');
              loadSuperStats();
              loadHubinClasses();
            }}
            className="shrink-0 text-[11px] font-bold bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy/80 transition-colors"
          >
            Coba Lagi
          </button>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          LOADING
      ══════════════════════════════════════════════════════ */}

      {statsState === 'loading' ? (

        <div className="flex-1 flex items-center justify-center">

          <div className="flex items-center gap-2 text-navy/60">

            <Loader2 className="w-5 h-5 animate-spin text-steel" />

            <span className="text-sm font-semibold">
              Memuat statistik...
            </span>

          </div>

        </div>

      ) : (

        <>
          {/* ════════════════════════════════════════════════
              CHART
          ════════════════════════════════════════════════ */}

          <DashboardCharts role="hubin" />

          {/* ════════════════════════════════════════════════
              STATS CARDS
          ════════════════════════════════════════════════ */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">

            {stats.map((s) => (

              <button
                key={s.label}
                onClick={() => {
                  if (s.tefaView) {
                    setSelectedTefaView(s.tefaView);
                    setTefaTableSearch('');
                  } else {
                    onNavigate(s.page);
                  }
                }}
                className="bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[130px] text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between"
              >

                <div className="flex items-center justify-between">

                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">

                    <s.icon className="w-4 h-4 text-white" />

                  </div>

                  <ChevronRight className={`w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all ${s.tefaView ? 'rotate-90' : ''}`} />

                </div>

                <div>

                  <p className="text-3xl font-bold text-navy tabular-nums leading-none">
                    {s.value}
                  </p>

                  <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">
                    {s.label}
                  </p>
                  {s.tefaView && (
                    <p className="text-[10px] font-semibold text-steel mt-1">Klik untuk lihat daftar siswa</p>
                  )}

                </div>

              </button>

            ))}

          </div>

          {selectedTefaView && (
            <section className="bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden">
              <div className="p-4 md:p-5 border-b border-mist/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-navy">
                    Daftar Siswa {selectedTefaView === 'internal' ? 'TEFA Internal' : 'TEFA Eksternal'}
                  </h3>
                  <p className="text-xs text-navy/50 mt-1">
                    {selectedTefaView === 'internal'
                      ? 'Siswa yang melaksanakan TEFA di lingkungan sekolah.'
                      : 'Siswa yang melaksanakan TEFA di industri/perusahaan.'}
                    {' '}Total: {tefaTableStudents.length} siswa.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={tefaTableSearch}
                    onChange={(event) => setTefaTableSearch(event.target.value)}
                    placeholder="Cari nama, kelas, perusahaan..."
                    className="w-full sm:w-64 bg-mist/40 border border-mist rounded-[18px] px-3 py-2.5 text-sm text-navy outline-none focus:border-steel"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedTefaView(null)}
                    className="px-4 py-2.5 rounded-[18px] bg-navy text-white text-xs font-bold hover:bg-navy/90 transition-colors"
                  >
                    Tutup daftar
                  </button>
                </div>
              </div>
              <div className="p-3 md:p-4 space-y-2.5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {tefaTableStudents.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-mist px-4 py-12 text-center">
                    <GraduationCap className="w-8 h-8 text-navy/25 mx-auto mb-2" />
                    <p className="text-sm font-bold text-navy">Belum ada siswa pada kategori ini</p>
                    <p className="text-xs text-navy/50 mt-1">Coba ubah kata kunci pencarian atau pilih kategori lainnya.</p>
                  </div>
                ) : (
                  tefaTableStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[22px] border border-mist/70 bg-white p-3 md:p-4 transition-colors hover:border-steel/40 hover:bg-mist/10"
                    >
                      <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                        {getInitials(student.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy truncate">{student.name}</p>
                        <p className="text-[11px] text-navy/55 mt-1 truncate">
                          {student.kelas || 'Kelas belum tersedia'}
                          {' · '}
                          {selectedTefaView === 'internal'
                            ? 'Di lingkungan sekolah'
                            : student.perusahaan && student.perusahaan !== '-'
                              ? student.perusahaan
                              : 'Tempat belum ditentukan'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedTefaView === 'internal' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                            {selectedTefaView === 'internal' ? 'TEFA Internal' : 'TEFA Eksternal'}
                          </span>
                          <span className="inline-flex rounded-full bg-navy text-white px-2.5 py-1 text-[10px] font-bold">
                            Terpetakan
                          </span>
                          <span className="text-[10px] text-navy/50">
                            Guru: {student.guruPembimbing && student.guruPembimbing !== '-' ? student.guruPembimbing : 'Belum ditentukan'}
                          </span>
                          <span className="text-[10px] text-navy/50">
                            Mentor: {student.mentor && student.mentor !== '-' ? student.mentor : 'Belum ditentukan'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('pemetaan')}
                        className="shrink-0 self-start sm:self-center px-3.5 py-2 rounded-xl border border-mist text-xs font-bold text-navy hover:bg-navy hover:text-white transition-colors"
                      >
                        Kelola
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-mist/60 text-[11px] font-medium text-navy/50">
                Kategori TEFA tersimpan di database dan tersinkron dengan data siswa.
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════════════
              MAIN CONTENT
          ════════════════════════════════════════════════ */}

          {!selectedTefaView && (
          <div className="lg:flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 lg:min-h-0">

            {/* ══════════════════════════════════════════════
                LEFT — DAFTAR KELAS
            ══════════════════════════════════════════════ */}

            <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-[380px] lg:min-h-0">

              {/* HEADER KELAS */}

              <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">

                <div className="flex items-center gap-2">

                  <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">

                    <GraduationCap className="w-3.5 h-3.5 text-white" />

                  </div>

                  <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                    Siswa yang Terpetakan
                  </p>

                </div>

                <button
                  onClick={() => onNavigate('pemetaan')}
                  className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1"
                >
                  Kelola Pemetaan

                  <ChevronRight className="w-3 h-3" />
                </button>

              </div>

              {/* LIST KELAS */}

              <div className="lg:flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 lg:min-h-0 max-h-[50vh] lg:max-h-none">

                {mappedStudents.length === 0 ? (

                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">

                    <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">

                      <GraduationCap className="w-6 h-6 text-white" />

                    </div>

                    <p className="text-sm font-bold text-navy mb-1">
                      Belum ada siswa terpetakan
                    </p>

                    <p className="text-xs text-navy/50 max-w-xs">
                      Siswa dengan perusahaan PKL akan tampil di sini.
                    </p>

                  </div>

                ) : (

                  mappedStudents.slice(0, 8).map((student) => (

                    <button
                      key={student.id}
                      onClick={() =>
                        onNavigate('pemetaan')
                      }
                      className="p-3 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:bg-mist/30 transition-all shrink-0 text-left group"
                    >

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                          {getInitials(student.name)}
                        </div>

                        <div className="flex-1 min-w-0">

                          <p className="text-sm font-bold text-navy truncate">
                            {student.name}
                          </p>

                          <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                            {[student.kelas, student.perusahaan]
                              .filter((value) => value && value !== '-')
                              .join(' · ') || 'Kelas atau perusahaan belum tersedia'}
                          </p>

                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">

                          <span className="text-[10px] font-bold bg-steel text-white shadow-sm shadow-steel/30 px-2.5 py-1 rounded-full tabular-nums">
                            Terpetakan
                          </span>

                          <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />

                        </div>

                      </div>

                    </button>

                  ))

                )}

              </div>

            </div>

            {/* ══════════════════════════════════════════════
                RIGHT
            ══════════════════════════════════════════════ */}

            <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 lg:min-h-0">

              {/* ═══════════════════════════════════════════
                  DISTRIBUSI PENGGUNA
              ═══════════════════════════════════════════ */}

              <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">

                <div className="relative z-10">

                  <div className="flex items-center justify-between mb-4">

                    <div className="flex items-center gap-2">

                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">

                        <Users className="w-4 h-4 text-white" />

                      </div>

                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                        Distribusi Pengguna
                      </p>

                    </div>

                    <span className="text-[11px] font-bold bg-white/15 text-white px-3 py-1.5 rounded-full tabular-nums">
                      {totalUsers} total
                    </span>

                  </div>

                  <div className="space-y-3">

                    {roleRows.map((r) => (

                      <div key={r.label}>

                        <div className="flex items-center justify-between mb-1">

                          <div className="flex items-center gap-2">

                            <r.icon className="w-3.5 h-3.5 text-steel" />

                            <span className="text-[12px] font-bold text-white/80">
                              {r.label}
                            </span>

                          </div>

                          <span className="text-[12px] font-bold text-white tabular-nums">
                            {r.value}
                          </span>

                        </div>

                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">

                          <div
                            className="h-full bg-white rounded-full transition-all duration-700"
                            style={{
                              width: `${
                                totalUsers
                                  ? Math.round(
                                      (r.value /
                                        totalUsers) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                          />

                        </div>

                      </div>

                    ))}

                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">

                    <span className="relative flex h-2 w-2 shrink-0">

                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-40" />

                      <span className="relative inline-flex rounded-full h-2 w-2 bg-steel" />

                    </span>

                    <p className="text-[11px] font-semibold text-white/60">
                      Database terhubung · {userName}
                    </p>

                  </div>

                </div>

              </div>

              {/* ═══════════════════════════════════════════
                  QUICK STATS
              ═══════════════════════════════════════════ */}

              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">

                <div className="grid grid-cols-3 gap-2">

                  {quickStats.map((q) => (

                    <div
                      key={q.label}
                      className="bg-white border border-mist/60 shadow-sm rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
                    >

                      <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">

                        <q.icon className="w-4 h-4 text-white" />

                      </div>

                      <div className="min-w-0">

                        <p className="text-lg font-bold text-navy tabular-nums leading-none">
                          {q.value}
                        </p>

                        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">
                          {q.label}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

              </div>

              {/* ═══════════════════════════════════════════
                  PERLU PERHATIAN
              ═══════════════════════════════════════════ */}

              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 lg:flex-1 flex flex-col min-h-[180px]">

                <div className="flex items-center justify-between mb-3 shrink-0">

                  <div className="flex items-center gap-2">

                    <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">

                      <AlertCircle className="w-3.5 h-3.5 text-white" />

                    </div>

                    <p className="text-[13px] font-bold text-navy">
                      Perlu Perhatian
                    </p>

                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                      attention.length > 0
                        ? 'bg-steel text-white shadow-sm shadow-steel/30'
                        : 'bg-white text-navy/70 border border-mist/60 shadow-sm'
                    }`}
                  >
                    {attention.length} item
                  </span>

                </div>

                <div className="lg:flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 lg:min-h-0 max-h-64 lg:max-h-none pr-1">

                  {attention.length === 0 ? (

                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">

                      <div className="w-12 h-12 rounded-[10px] bg-navy flex items-center justify-center mb-3">

                        <CheckCircle2 className="w-5 h-5 text-white" />

                      </div>

                      <p className="text-xs font-bold text-navy">
                        Semua data lengkap
                      </p>

                      <p className="text-[11px] text-navy/50 mt-0.5">
                        Tidak ada item yang perlu ditindaklanjuti
                      </p>

                    </div>

                  ) : (

                    attention.map((a) => (

                      <button
                        key={a.key}
                        onClick={() =>
                          onNavigate(a.page)
                        }
                        className="p-2.5 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:bg-mist/30 transition-all shrink-0 text-left group"
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center shrink-0 shadow-md shadow-navy/20">

                            <a.icon className="w-4 h-4 text-white" />

                          </div>

                          <div className="flex-1 min-w-0">

                            <p className="text-[13px] font-bold text-navy truncate">
                              {a.title}
                            </p>

                            <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                              {a.desc}
                            </p>

                          </div>

                          <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all shrink-0" />

                        </div>

                      </button>

                    ))

                  )}

                </div>

              </div>

            </div>

          </div>
          )}
        </>
      )}
    </div>
  );
};