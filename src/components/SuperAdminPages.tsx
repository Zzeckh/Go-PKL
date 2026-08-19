import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Building2, Users, Briefcase, GraduationCap,
  BookOpen, CheckCircle2, FileCheck, ShieldCheck, Search, Plus,
  Trash2, ToggleLeft, ToggleRight, X, MapPin, Phone, School, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   SUPER ADMIN DASHBOARD
   ══════════════════════════════════════════════════════ */
export const SuperAdminDashboard: React.FC<{ userName: string; onNavigate: (page: any) => void }> = ({ userName, onNavigate }) => {
  const { superStats, loadSuperStats, isAuthenticated } = useApp();

  // ✅ FIX: Tunggu isAuthenticated dulu, baru fetch stats
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Small delay to ensure token fully propagated
    const timer = setTimeout(() => {
      loadSuperStats();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, loadSuperStats]);

  const cards = [
    { label: 'Total Sekolah', value: superStats?.totalSchools ?? 0, icon: School, bg: 'bg-navy', page: 'super-schools' },
    { label: 'Total Siswa', value: superStats?.totalStudents ?? 0, icon: GraduationCap, bg: 'bg-steel', page: 'super-users' },
    { label: 'Total Guru', value: superStats?.totalTeachers ?? 0, icon: Users, bg: 'bg-navy', page: 'super-users' },
    { label: 'Total Mentor', value: superStats?.totalMentors ?? 0, icon: Briefcase, bg: 'bg-steel', page: 'super-users' },
    { label: 'Perusahaan Mitra', value: superStats?.totalCompanies ?? 0, icon: Building2, bg: 'bg-navy', page: 'super-companies' },
    { label: 'Total Absensi', value: superStats?.totalAbsensi ?? 0, icon: CheckCircle2, bg: 'bg-steel', page: null },
    { label: 'Total Logbook', value: superStats?.totalLogbooks ?? 0, icon: BookOpen, bg: 'bg-navy', page: null },
    { label: 'Total Perizinan', value: superStats?.totalPermissions ?? 0, icon: FileCheck, bg: 'bg-steel', page: null },
  ];

  const isStatsLoading = !superStats && isAuthenticated;

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
              Selamat datang kembali, {userName}
            </p>
          </div>
        </div>
      </div>

      {isStatsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-navy/60">
            <Loader2 className="w-5 h-5 animate-spin text-steel" />
            <span className="text-sm font-semibold">Memuat statistik...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-y-auto custom-scrollbar pb-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                onClick={() => c.page && onNavigate(c.page)}
                disabled={!c.page}
                className={`bg-white border border-mist/60 rounded-[24px] p-4 md:p-5 min-h-[140px] flex flex-col justify-between transition-all ${
                  c.page ? 'hover:border-steel/40 hover:shadow-md hover:-translate-y-0.5' : ''
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left mt-3">
                  <p className="text-3xl font-bold text-navy tabular-nums leading-none">{c.value}</p>
                  <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">{c.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   KELOLA SEKOLAH
   ══════════════════════════════════════════════════════ */
export const SuperSchools: React.FC = () => {
  const { superSchools, loadSuperSchools, createSchool, deleteSchool, isAuthenticated } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Guard isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadSuperSchools().finally(() => setLoading(false));
  }, [isAuthenticated, loadSuperSchools]);

  const filtered = useMemo(
    () => superSchools.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [superSchools, search]
  );

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <School className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Kelola Sekolah</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {superSchools.length} sekolah terdaftar
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Sekolah
        </button>
      </div>

      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari sekolah..."
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
                  <p className="text-sm text-navy/50">Tidak ada sekolah ditemukan.</p>
                </div>
              ) : (
                filtered.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl border border-mist/60 bg-white hover:border-steel/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center shrink-0">
                        <School className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus sekolah "${s.name}"?`)) deleteSchool(s.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm text-navy truncate">{s.name}</h3>
                    <p className="text-[11px] text-navy/50 truncate mt-0.5">{s.address || 'Tidak ada alamat'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg p-2 text-center">
                        <p className="text-base font-bold text-navy tabular-nums">{s.totalUsers}</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase">Users</p>
                      </div>
                      <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg p-2 text-center">
                        <p className="text-base font-bold text-navy tabular-nums">{s.totalClasses}</p>
                        <p className="text-[9px] font-bold text-navy/50 uppercase">Kelas</p>
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
        <AddSchoolModal
          onClose={() => setShowAdd(false)}
          onCreate={createSchool}
        />
      )}
    </div>
  );
};

const AddSchoolModal: React.FC<{
  onClose: () => void;
  onCreate: (data: { name: string; address?: string; phone?: string }) => Promise<any>;
}> = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
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
      setError(err?.data?.error || err?.message || 'Gagal menambah sekolah.');
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
              <School className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy">Tambah Sekolah Baru</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-mist/60 hover:bg-mist flex items-center justify-center">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Nama Sekolah *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: SMKN 11 Bandung"
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Alamat
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat lengkap"
              className="w-full bg-[#F1F4F8] border border-mist rounded-xl px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-1.5">
              Telepon
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="022-xxxxxxx"
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
  const { superUsers, loadSuperUsers, toggleUser, isAuthenticated } = useApp();
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Guard isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadSuperUsers({ role: roleFilter, search }).finally(() => setLoading(false));
  }, [isAuthenticated, loadSuperUsers, roleFilter, search]);

  const roles = [
    { key: 'all', label: 'Semua', icon: Users },
    { key: 'student', label: 'Siswa', icon: GraduationCap },
    { key: 'teacher', label: 'Guru', icon: Users },
    { key: 'mentor', label: 'Mentor', icon: Briefcase },
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
                      u.role === 'student' ? 'bg-navy text-white' :
                      u.role === 'teacher' ? 'bg-navy text-white' :
                      u.role === 'mentor' ? 'bg-steel text-white' :
                      u.role === 'hubin' ? 'bg-steel text-white' :
                      u.role === 'super_admin' ? 'bg-navy text-white' :
                      'bg-navy text-white'
                    }`}>
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-navy truncate">{u.name}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {u.email} · {u.school}
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
                      <button
                        onClick={() => toggleUser(u.id)}
                        className="w-9 h-9 rounded-lg bg-[#F1F4F8] hover:bg-mist flex items-center justify-center text-navy/70 transition-colors shrink-0"
                        title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
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

/* ══════════════════════════════════════════════════════
   KELOLA PERUSAHAAN
   ══════════════════════════════════════════════════════ */
export const SuperCompanies: React.FC = () => {
  const { superCompanies, loadSuperCompanies, isAuthenticated } = useApp();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Guard isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadSuperCompanies().finally(() => setLoading(false));
  }, [isAuthenticated, loadSuperCompanies]);

  const filtered = useMemo(
    () => superCompanies.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [superCompanies, search]
  );

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Semua Perusahaan Mitra</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {superCompanies.length} perusahaan terdaftar
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari perusahaan..."
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
                  <p className="text-sm text-navy/50">Tidak ada perusahaan ditemukan.</p>
                </div>
              ) : (
                filtered.map(c => {
                  const hasCoords = c.latitude != null && c.longitude != null;
                  return (
                    <div key={c.id} className="p-4 rounded-2xl border border-mist/60 bg-white hover:border-steel/30 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-steel/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-steel" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-navy truncate">{c.name}</p>
                          <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">{c.address}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-navy/60">Kuota</span>
                          <span className="text-[11px] font-bold text-navy tabular-nums">{c.filled} / {c.quota}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#F1F4F8] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-navy/60">Mentor</span>
                          <span className="text-[11px] font-bold text-navy truncate ml-2">{c.mentor || '-'}</span>
                        </div>
                        <div className={`flex justify-between items-center rounded-lg px-2.5 py-1.5 border ${
                          hasCoords ? 'bg-steel/10 border-steel/30' : 'bg-[#FBF3E2] border-[#F0E1C0]'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <MapPin className={`w-3.5 h-3.5 ${hasCoords ? 'text-steel' : 'text-[#9A6B15]'}`} />
                            <span className={`text-[11px] font-bold ${hasCoords ? 'text-steel' : 'text-[#9A6B15]'}`}>
                              {hasCoords ? 'Koordinat Aktif' : 'Belum Diatur'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};