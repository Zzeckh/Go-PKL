import React, { useState, useEffect, useMemo } from 'react';
import {
  BookMarked, Search, Plus, Trash2, X, Loader2, Users, GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   KELOLA KELAS
   ══════════════════════════════════════════════════════ */
export const SuperClasses: React.FC = () => {
  const { superClasses, loadSuperClasses, createClass, deleteClass, loadClassStudents, isAuthenticated } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadSuperClasses().finally(() => setLoading(false));
  }, [isAuthenticated, loadSuperClasses]);

  const openDetail = async (cls: any) => {
    setDetailLoading(true);
    setDetail({ id: cls.id, name: cls.name, major: cls.major || '-', students: [] });
    try {
      const res = await loadClassStudents(cls.id);
      setDetail(res);
    } catch (err: any) {
      alert(err?.data?.error || err?.message || 'Gagal memuat siswa kelas.');
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = useMemo(
    () => superClasses.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.major || '').toLowerCase().includes(search.toLowerCase())
    ),
    [superClasses, search]
  );

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
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
          className="flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-[24px] shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Kelas
        </button>
      </div>

      {/* ✅ Search bar: mist/40 + clear button */}
      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari kelas atau jurusan..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.length === 0 ? (
                /* ✅ Empty state: navy solid + icon putih */
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-bold text-navy mb-1">Kelas tidak ditemukan</p>
                  <p className="text-xs text-navy/50 max-w-xs">
                    {search ? `Tidak ada kelas yang cocok dengan "${search}"` : 'Belum ada kelas. Klik "Tambah Kelas" untuk memulai.'}
                  </p>
                </div>
              ) : (
                filtered.map(c => (
                  <div key={c.id} className="p-4 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:shadow-sm transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <button
                        onClick={() => openDetail(c)}
                        className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center shrink-0 hover:bg-navy/90 transition-colors shadow-md shadow-navy/20"
                      >
                        <BookMarked className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus kelas "${c.name}"?`)) deleteClass(c.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-mist/60 text-navy/50 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center transition-colors"
                        title="Hapus kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => openDetail(c)} className="w-full text-left">
                      <h3 className="font-bold text-sm text-navy truncate">{c.name}</h3>
                      <p className="text-[11px] text-navy/50 truncate mt-0.5">{c.major || 'Jurusan belum diisi'}</p>
                    </button>
                    {/* ✅ Card stat: card putih + chip navy */}
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <button
                        onClick={() => openDetail(c)}
                        className="bg-white border border-mist/60 shadow-sm rounded-2xl p-2.5 flex items-center gap-3 hover:border-steel/40 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-lg font-bold text-navy tabular-nums leading-none">{c.totalStudents}</p>
                          <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Siswa · Lihat Detail</p>
                        </div>
                      </button>
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

      {detail && (
        <ClassDetailModal
          detail={detail}
          loading={detailLoading}
          onClose={() => setDetail(null)}
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy">Tambah Kelas Baru</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
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
              className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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
              className="w-full bg-mist/30 border border-mist rounded-[24px] px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
            />
          </div>
          {error && (
            <div className="p-3 bg-navy/5 border border-navy/15 rounded-[24px] text-xs font-semibold text-navy">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-mist/60 text-navy/70 font-bold text-sm py-3 rounded-[24px] hover:bg-mist transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-steel text-white font-bold text-sm py-3 rounded-[24px] hover:bg-steel/90 shadow-lg shadow-steel/25 disabled:opacity-60 transition-all">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL DETAIL SISWA PER KELAS
   ══════════════════════════════════════════════════════ */
const ClassDetailModal: React.FC<{
  detail: any;
  loading: boolean;
  onClose: () => void;
}> = ({ detail, loading, onClose }) => {
  const students = detail.students || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-2xl w-full shadow-2xl border border-mist/60 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shrink-0">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-navy leading-tight truncate">{detail.name}</h3>
              <p className="text-[11px] font-semibold text-navy/50 truncate">
                {detail.major || 'Jurusan belum diisi'} · {students.length} siswa
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-2 text-navy/60">
                <Loader2 className="w-5 h-5 animate-spin text-steel" />
                <span className="text-sm font-semibold">Memuat siswa...</span>
              </div>
            </div>
          ) : students.length === 0 ? (
            /* ✅ Empty state: navy solid + icon putih */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Belum ada siswa</p>
              <p className="text-xs text-navy/50 max-w-xs">Tidak ada siswa terdaftar di kelas ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s: any) => (
                <div key={s.id} className="p-3 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3 hover:border-steel/30 transition-colors">
                  {/* ✅ Avatar kotak navy (siswa) */}
                  <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-navy truncate">{s.name}</p>
                    <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                      {s.email} · {s.perusahaan || '-'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {/* ✅ Badge solid */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        s.isActive
                          ? 'bg-steel text-white shadow-sm shadow-steel/30'
                          : 'bg-navy text-white'
                      }`}>
                        <GraduationCap className="w-3 h-3" /> {s.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {/* ✅ Card putih ber-border */}
                      <span className="text-[10px] font-bold bg-white text-navy/70 border border-mist/60 shadow-sm px-2.5 py-1 rounded-full tabular-nums shrink-0">
                        {s.kehadiran} absensi
                      </span>
                      <span className="text-[10px] font-bold bg-white text-navy/70 border border-mist/60 shadow-sm px-2.5 py-1 rounded-full tabular-nums shrink-0">
                        {s.logbooks} logbook
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};