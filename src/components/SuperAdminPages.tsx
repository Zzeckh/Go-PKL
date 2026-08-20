import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, GraduationCap, BookOpen, CheckCircle2,
  FileCheck, ShieldCheck, Search, Plus, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, Clock, ChevronRight, AlertCircle, BookMarked
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

      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
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
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-[#F1F4F8] border border-[#E2E8F0] px-3 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 border border-steel/20 px-3 py-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-steel" />
            </span>
            System Online
          </span>
        </div>
      </div>

      {statsState === 'error' && (
        <div className="shrink-0 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-[12px] font-semibold text-rose-700 leading-snug">
              Gagal memuat statistik. Periksa terminal backend, lalu coba lagi.
            </p>
          </div>
          <button
            onClick={() => setStatsState('loading')}
            className="shrink-0 text-[11px] font-bold bg-rose-500 text-white px-3 py-1.5 rounded-lg hover:bg-rose-600 transition-colors"
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
            {stats.map((s) => (
              <button
                key={s.label}
                onClick={() => onNavigate(s.page)}
                className="bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[130px] text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F1F4F8] flex items-center justify-center group-hover:bg-steel/10 transition-colors">
                    <s.icon className="w-5 h-5 text-navy/60 group-hover:text-steel transition-colors" />
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
                  <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                    <BookMarked className="w-3.5 h-3.5 text-steel" />
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
                    <div className="w-14 h-14 rounded-2xl bg-[#F1F4F8] flex items-center justify-center mb-3">
                      <BookMarked className="w-6 h-6 text-navy/30" />
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
                      className="p-3 rounded-xl border border-mist/60 bg-white hover:border-steel/30 hover:bg-[#F1F4F8]/50 transition-all shrink-0 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-navy truncate">{c.name}</p>
                          <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                            {c.major || 'Jurusan belum diisi'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold bg-[#F1F4F8] border border-[#E2E8F0] text-navy/70 px-2 py-1 rounded-full tabular-nums">
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

              <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
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

              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  {quickStats.map((q) => (
                    <div key={q.label} className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <q.icon className="w-4 h-4 text-navy/50 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-navy tabular-nums leading-none">{q.value}</p>
                        <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{q.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex-1 flex flex-col min-h-[180px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-mist flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 text-navy" />
                    </div>
                    <p className="text-[13px] font-bold text-navy">Perlu Perhatian</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                    attention.length > 0 ? 'bg-[#FBF3E2] text-[#9A6B15]' : 'bg-[#F1F4F8] text-navy/40'
                  }`}>
                    {attention.length} item
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-0 pr-1">
                  {attention.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#E4F0F1] flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-steel" />
                      </div>
                      <p className="text-xs font-bold text-navy">Semua data lengkap</p>
                      <p className="text-[11px] text-navy/50 mt-0.5">Tidak ada item yang perlu ditindaklanjuti</p>
                    </div>
                  ) : (
                    attention.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => onNavigate(a.page)}
                        className="p-2.5 rounded-xl border border-mist/60 bg-white hover:border-steel/30 transition-all shrink-0 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            a.tint === 'amber' ? 'bg-[#FBF3E2] text-[#9A6B15]' : 'bg-[#F1F4F8] text-navy/50'
                          }`}>
                            <a.icon className="w-4 h-4" />
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

/* ══════════════════════════════════════════════════════
   KELOLA KELAS
   ══════════════════════════════════════════════════════ */
export const SuperClasses: React.FC = () => {
  const { superClasses, loadSuperClasses, createClass, deleteClass, isAuthenticated } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadSuperClasses().finally(() => setLoading(false));
  }, [isAuthenticated, loadSuperClasses]);

  const filtered = useMemo(
    () => superClasses.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.major || '').toLowerCase().includes(search.toLowerCase())
    ),
    [superClasses, search]
  );

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <BookMarked className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Kelola Kelas</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {superClasses.length} kelas terdaftar
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Kelas
        </button>
      </div>

      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari kelas atau jurusan..."
          className="w-full bg-white border border-mist/60 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
        />
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-2 text-navy/60">
                <Loader2 className="w-5 h-5 animate-spin text-steel" />
                <span className="text-sm font-semibold">Memuat data...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-sm text-navy/50">Tidak ada kelas ditemukan.</p>
                </div>
              ) : (
                filtered.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl border border-mist/60 bg-white hover:border-steel/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center shrink-0">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus kelas "${c.name}"?`)) deleteClass(c.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm text-navy truncate">{c.name}</h3>
                    <p className="text-[11px] text-navy/50 truncate mt-0.5">{c.major || 'Jurusan belum diisi'}</p>
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg p-2 text-center">
                        <p className="text-base font-bold text-navy tabular-nums">{c.totalStudents}</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase">Siswa</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddClassModal
          onClose={() => setShowAdd(false)}
          onCreate={createClass}
        />
      )}
    </div>
  );
};

const AddClassModal: React.FC<{
  onClose: () => void;
  onCreate: (data: { name: string; major?: string }) => Promise<any>;
}> = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', major: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onCreate(form);
      onClose();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Gagal menambah kelas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60">
        <div className="p-5 border-b border-mist/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy">Tambah Kelas Baru</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-mist/60 hover:bg-mist flex items-center justify-center">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Nama Kelas *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: XII RPL 2"
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Jurusan / Bidang Keahlian
            </label>
            <input
              type="text"
              value={form.major}
              onChange={e => setForm({ ...form, major: e.target.value })}
              placeholder="Contoh: Rekayasa Perangkat Lunak"
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
            />
          </div>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-xl">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-xl hover:bg-steel/90 shadow-lg shadow-steel/25 disabled:opacity-60">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   KELOLA PENGGUNA
   ══════════════════════════════════════════════════════ */
export const SuperUsers: React.FC = () => {
  const { superUsers, loadSuperUsers, toggleUser, deleteUser, updateUserRole, isAuthenticated } = useApp();
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadSuperUsers({ role: roleFilter, search }).finally(() => setLoading(false));
  }, [isAuthenticated, loadSuperUsers, roleFilter, search]);

  const roles = [
    { key: 'all', label: 'Semua', icon: Users },
    { key: 'student', label: 'Siswa', icon: GraduationCap },
    { key: 'teacher', label: 'Guru', icon: Users },
    { key: 'mentor', label: 'Mentor', icon: Users },
    { key: 'hubin', label: 'Hubin', icon: ShieldCheck },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Kelola Pengguna</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {superUsers.length} user ditemukan
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-3">
        <div className="bg-[#F1F4F8] p-1 rounded-xl flex gap-1 overflow-x-auto">
          {roles.map(r => {
            const Icon = r.icon;
            const active = roleFilter === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  active ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {r.label}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full bg-white border border-mist/60 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-2 text-navy/60">
                <Loader2 className="w-5 h-5 animate-spin text-steel" />
                <span className="text-sm font-semibold">Memuat data...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {superUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-navy/50">Tidak ada user ditemukan.</p>
                </div>
              ) : (
                superUsers.map(u => (
                  <div key={u.id} className="p-3 rounded-2xl border border-mist/60 bg-white flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      u.role === 'mentor' || u.role === 'hubin' ? 'bg-steel text-white' : 'bg-navy text-white'
                    }`}>
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-navy truncate">{u.name}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {u.email} · {u.class || '-'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isActive ? 'bg-steel/15 text-steel' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <span className="text-[10px] font-bold bg-[#F1F4F8] text-navy/60 px-2 py-0.5 rounded-full uppercase">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {u.role !== 'super_admin' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const role = e.target.value;
                            if (confirm(`Ubah role "${u.name}" menjadi ${role.replace('_', ' ')}?`)) {
                              updateUserRole(u.id, role).catch((err: any) => alert(err?.data?.error || err?.message || 'Gagal mengubah role.'));
                            }
                          }}
                          title="Ubah role"
                          className="h-9 bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg px-2 text-xs font-bold text-navy outline-none focus:border-steel cursor-pointer capitalize"
                        >
                          <option value="student">Siswa</option>
                          <option value="teacher">Guru</option>
                          <option value="mentor">Mentor</option>
                          <option value="hubin">Hubin</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pengguna "${u.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
                              deleteUser(u.id).catch((err: any) => alert(err?.data?.error || err?.message || 'Gagal menghapus user.'));
                            }
                          }}
                          className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                          title="Hapus user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleUser(u.id)}
                          className="w-9 h-9 rounded-lg bg-[#F1F4F8] hover:bg-mist flex items-center justify-center text-navy/70 transition-colors"
                          title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
