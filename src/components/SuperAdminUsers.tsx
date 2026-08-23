import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, ShieldCheck, Search, Trash2, ToggleLeft, ToggleRight,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
        <div className="bg-shell p-1 rounded-[24px] flex gap-1 overflow-x-auto">
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
            className="w-full bg-white border border-mist/60 rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
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
                  <div key={u.id} className="p-3 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3">
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
                          u.isActive ? 'bg-steel/15 text-steel' : 'bg-navy/10 text-navy'
                        }`}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <span className="text-[10px] font-bold bg-shell text-navy/60 px-2 py-0.5 rounded-full uppercase">
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
                          className="h-9 bg-shell border border-mist rounded-lg px-2 text-xs font-bold text-navy outline-none focus:border-steel cursor-pointer capitalize"
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
                          className="w-9 h-9 rounded-lg bg-navy/5 text-navy/60 hover:bg-navy/10 flex items-center justify-center transition-colors"
                          title="Hapus user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleUser(u.id)}
                          className="w-9 h-9 rounded-lg bg-shell hover:bg-mist flex items-center justify-center text-navy/70 transition-colors"
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
