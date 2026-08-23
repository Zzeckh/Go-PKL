import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, BookOpen, CheckCircle2,
  FileCheck, ShieldCheck, Clock, ChevronRight, AlertCircle, BookMarked,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   SUPER ADMIN DASHBOARD
   ══════════════════════════════════════════════════════ */
export const SuperAdminDashboard: React.FC<{ userName: string; onNavigate: (page: any) => void }> = ({ userName, onNavigate }) => {
  const {
    superStats, loadSuperStats,
    superClasses, loadSuperClasses,
    isAuthenticated,
  } = useApp();

  const [statsState, setStatsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const run = async (attempt = 0) => {
      setStatsState('loading');
      const ok = await loadSuperStats();
      if (cancelled) return;
      if (ok) setStatsState('ready');
      else if (attempt < 2) setTimeout(() => run(attempt + 1), 700);
      else setStatsState('error');
    };

    run();
    loadSuperClasses();
    return () => { cancelled = true; };
  }, [isAuthenticated, loadSuperStats, loadSuperClasses]);

  const roleRows = [
    { icon: GraduationCap, label: 'Siswa', value: superStats?.totalStudents ?? 0 },
    { icon: Users, label: 'Guru', value: superStats?.totalTeachers ?? 0 },
    { icon: Users, label: 'Mentor', value: superStats?.totalMentors ?? 0 },
    { icon: ShieldCheck, label: 'Hubin', value: superStats?.totalHubins ?? 0 },
  ];
  const totalUsers = roleRows.reduce((s, r) => s + r.value, 0);

  const stats = [
    { icon: BookMarked, label: 'Total Kelas', value: superStats?.totalClasses ?? 0, page: 'super-classes' },
    { icon: GraduationCap, label: 'Total Siswa', value: superStats?.totalStudents ?? 0, page: 'super-users' },
    { icon: Users, label: 'Total Pembimbing', value: (superStats?.totalTeachers ?? 0) + (superStats?.totalMentors ?? 0), page: 'super-users' },
  ];

  const quickStats = [
    { icon: CheckCircle2, label: 'Absensi', value: superStats?.totalAbsensi ?? 0 },
    { icon: BookOpen, label: 'Logbook', value: superStats?.totalLogbooks ?? 0 },
    { icon: FileCheck, label: 'Perizinan', value: superStats?.totalPermissions ?? 0 },
  ];

  const attention = [
    ...superClasses
      .filter(c => (c.totalStudents ?? 0) === 0)
      .map(c => ({ key: `cls-${c.id}`, icon: BookMarked, tint: 'mist', title: c.name, desc: 'Belum ada siswa terdaftar', page: 'super-classes' })),
  ].slice(0, 5);

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Super Admin Control
            </h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Kelola kelas & pengguna dalam satu panel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* ✅ chip tanggal: bg mist/40 */}
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-mist/40 border border-mist px-3 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          {/* ✅ chip System Online: card putih ber-border steel */}
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-white border border-steel/30 shadow-sm px-3 py-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-steel" />
            </span>
            System Online
          </span>
        </div>
      </div>

      {statsState === 'error' && (
        <div className="shrink-0 bg-navy/5 border border-navy/15 rounded-[24px] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-navy/60 shrink-0" />
            <p className="text-[12px] font-semibold text-navy leading-snug">
              Gagal memuat statistik. Periksa terminal backend, lalu coba lagi.
            </p>
          </div>
          <button
            onClick={() => setStatsState('loading')}
            className="shrink-0 text-[11px] font-bold bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy/80 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {statsState === 'loading' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-navy/60">
            <Loader2 className="w-5 h-5 animate-spin text-steel" />
            <span className="text-sm font-semibold">Memuat statistik...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── STATS CARDS — icon chip navy solid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
            {stats.map((s) => (
              <button
                key={s.label}
                onClick={() => onNavigate(s.page)}
                className="bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[130px] text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
                  <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">{s.label}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">

            {/* ── LEFT: Daftar Kelas ── */}
            <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-[380px] lg:min-h-0">
              <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  {/* ✅ chip navy solid + icon putih */}
                  <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
                    <BookMarked className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                    Kelas Terdaftar
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('super-classes')}
                  className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1"
                >
                  Kelola Kelas <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 min-h-0">
                {superClasses.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    {/* ✅ empty state: navy solid + icon putih */}
                    <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                      <BookMarked className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-navy mb-1">Belum ada kelas</p>
                    <p className="text-xs text-navy/50 max-w-xs">
                      Tambahkan kelas melalui menu Kelola Kelas.
                    </p>
                  </div>
                ) : (
                  superClasses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onNavigate('super-classes')}
                      className="p-3 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:bg-mist/30 transition-all shrink-0 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        {/* ✅ avatar kelas: navy solid */}
                        <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                          {getInitials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-navy truncate">{c.name}</p>
                          <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                            {c.major || 'Jurusan belum diisi'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* ✅ badge jumlah siswa: solid steel */}
                          <span className="text-[10px] font-bold bg-steel text-white shadow-sm shadow-steel/30 px-2.5 py-1 rounded-full tabular-nums">
                            {c.totalStudents} siswa
                          </span>
                          <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">

              {/* Card Distribusi Pengguna navy */}
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
                            <span className="text-[12px] font-bold text-white/80">{r.label}</span>
                          </div>
                          <span className="text-[12px] font-bold text-white tabular-nums">{r.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-steel rounded-full transition-all duration-700"
                            style={{ width: `${totalUsers ? Math.round((r.value / totalUsers) * 100) : 0}%` }}
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

              {/* ── Quick stats — card putih + icon chip navy solid ── */}
              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  {quickStats.map((q) => (
                    <div key={q.label} className="bg-white border border-mist/60 shadow-sm rounded-2xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                        <q.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-navy tabular-nums leading-none">{q.value}</p>
                        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{q.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Card Perlu Perhatian ── */}
              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex-1 flex flex-col min-h-[180px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* ✅ chip navy solid + icon putih */}
                    <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-[13px] font-bold text-navy">Perlu Perhatian</p>
                  </div>
                  {/* ✅ badge item: solid steel / card putih */}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                    attention.length > 0
                      ? 'bg-steel text-white shadow-sm shadow-steel/30'
                      : 'bg-white text-navy/70 border border-mist/60 shadow-sm'
                  }`}>
                    {attention.length} item
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-0 pr-1">
                  {attention.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      {/* ✅ empty state: navy solid + icon putih */}
                      <div className="w-12 h-12 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-navy">Semua data lengkap</p>
                      <p className="text-[11px] text-navy/50 mt-0.5">Tidak ada item yang perlu ditindaklanjuti</p>
                    </div>
                  ) : (
                    attention.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => onNavigate(a.page)}
                        className="p-2.5 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:bg-mist/30 transition-all shrink-0 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          {/* ✅ icon chip navy solid */}
                          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center shrink-0 shadow-md shadow-navy/20">
                            <a.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-navy truncate">{a.title}</p>
                            <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">{a.desc}</p>
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
        </>
      )}
    </div>
  );
};