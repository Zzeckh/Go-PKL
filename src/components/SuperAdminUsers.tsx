import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, ShieldCheck, Search, Trash2, ToggleLeft, ToggleRight,
  Loader2, X, Briefcase, KeyRound, Copy, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   KELOLA PENGGUNA
   ══════════════════════════════════════════════════════ */
export const SuperUsers: React.FC = () => {
  const { superUsers, loadSuperUsers, toggleUser, deleteUser, updateUserRole, resetPassword, isAuthenticated } = useApp();
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState<{ userId: number; userName: string; newPassword: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

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
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
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
        {/* ✅ Filter pills: track mist/40, aktif steel solid */}
        <div className="bg-mist/40 p-1 rounded-[24px] flex gap-1 overflow-x-auto">
          {roles.map(r => {
            const Icon = r.icon;
            const active = roleFilter === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  active ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {r.label}
              </button>
            );
          })}
        </div>
        {/* ✅ Search bar: mist/40 + clear button */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full bg-mist/40 border border-mist rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy/10 hover:bg-navy/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-navy/60" />
            </button>
          )}
        </div>
      </div>

      <div className="lg:flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col lg:min-h-0">
        <div className="lg:flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 max-h-[65vh] lg:max-h-none">
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
                /* ✅ Empty state: navy solid + icon putih */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-bold text-navy mb-1">User tidak ditemukan</p>
                  <p className="text-xs text-navy/50 max-w-xs">
                    {search ? `Tidak ada user yang cocok dengan "${search}"` : 'Belum ada user pada filter ini.'}
                  </p>
                </div>
              ) : (
                superUsers.map(u => (
                  <div key={u.id} className="p-3 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3 hover:border-steel/30 hover:shadow-sm transition-all">
                    {/* ✅ Avatar kotak navy solid (semua role) */}
                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-navy truncate">{u.name}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {u.email} · {u.class || '-'}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {/* ✅ Badge status: solid */}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          u.isActive ? 'bg-steel text-white shadow-sm shadow-steel/30' : 'bg-navy text-white'
                        }`}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {/* ✅ Badge role: card putih ber-border */}
                        <span className="text-[10px] font-bold bg-white text-navy/70 border border-mist/60 shadow-sm px-2.5 py-1 rounded-full uppercase">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {u.role !== 'super_admin' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* ✅ Select role: card putih ber-border */}
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const role = e.target.value;
                            if (confirm(`Ubah role "${u.name}" menjadi ${role.replace('_', ' ')}?`)) {
                              updateUserRole(u.id, role).catch((err: any) => alert(err?.data?.error || err?.message || 'Gagal mengubah role.'));
                            }
                          }}
                          title="Ubah role"
                          className="h-9 bg-white border border-mist/60 shadow-sm rounded-lg px-2 text-xs font-bold text-navy outline-none focus:border-steel cursor-pointer capitalize"
                        >
                          <option value="student">Siswa</option>
                          <option value="teacher">Guru</option>
                          <option value="mentor">Mentor</option>
                          <option value="hubin">Hubin</option>
                        </select>
                        {/* ✅ Button reset password */}
                        <button
                          onClick={async () => {
                            if (!confirm(`Reset password "${u.name}"? Password baru akan ditampilkan setelah proses selesai.`)) return;
                            setResettingId(u.id);
                            try {
                              const res = await resetPassword(u.id);
                              setResetModal({ userId: res.id, userName: res.name, newPassword: res.newPassword });
                            } catch (err: any) {
                              alert(err?.data?.error || err?.message || 'Gagal mereset password.');
                            } finally {
                              setResettingId(null);
                            }
                          }}
                          className="w-9 h-9 rounded-lg bg-white border border-mist/60 text-navy/50 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 flex items-center justify-center transition-colors"
                          title="Reset password"
                          disabled={resettingId === u.id}
                        >
                          {resettingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        </button>
                        {/* ✅ Button hapus: card putih + hover red */}
                        <button
                          onClick={() => {
                            if (confirm(`Hapus pengguna "${u.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
                              deleteUser(u.id).catch((err: any) => alert(err?.data?.error || err?.message || 'Gagal menghapus user.'));
                            }
                          }}
                          className="w-9 h-9 rounded-lg bg-white border border-mist/60 text-navy/50 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center transition-colors"
                          title="Hapus user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {/* ✅ Button toggle: card putih ber-border */}
                        <button
                          onClick={() => toggleUser(u.id)}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                            u.isActive
                              ? 'bg-white border-mist/60 text-steel hover:bg-mist/30'
                              : 'bg-white border-mist/60 text-navy/50 hover:bg-mist/30'
                          }`}
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
      {/* ✅ Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] p-4 sm:p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy text-base">Password Baru</h3>
              <button onClick={() => setResetModal(null)} className="w-7 h-7 rounded-full bg-mist/40 hover:bg-mist flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-navy/60" />
              </button>
            </div>
            <div className="bg-mist/40 border border-mist/60 rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-navy/50 mb-1">Password baru untuk <span className="text-navy font-bold">{resetModal.userName}</span>:</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold text-navy bg-white border border-mist/60 rounded-xl px-3 py-2 flex-1 select-all">
                  {resetModal.newPassword}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetModal.newPassword);
                    setCopiedId(-1);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="w-9 h-9 rounded-xl bg-white border border-mist/60 hover:bg-mist/40 flex items-center justify-center transition-colors shrink-0"
                  title="Salin password"
                >
                  {copiedId === -1 ? <Check className="w-4 h-4 text-steel" /> : <Copy className="w-4 h-4 text-navy/50" />}
                </button>
              </div>
              <p className="text-[10px] text-navy/40 font-semibold mt-2">⚠️ Catat password ini. Super admin tidak bisa melihatnya lagi setelah ditutup.</p>
            </div>
            <button
              onClick={() => setResetModal(null)}
              className="w-full py-2.5 bg-navy text-white text-sm font-bold rounded-2xl hover:bg-steel transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};