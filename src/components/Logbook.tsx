import React, { useState } from 'react';
import { 
  Plus, BookOpen, CheckCircle2, Clock, X, Search, 
  AlertCircle, Loader2, Sparkles, FileEdit 
} from 'lucide-react';
import { LogEntry, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { Pencil, User } from 'lucide-react';

interface LogbookProps {
  logs: LogEntry[];
  onAddLog: (log: Omit<LogEntry, 'id' | 'date' | 'status'>) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  userRole?: UserRole;
}

type FilterType = 'all' | 'approved' | 'pending' | 'revision';

/* ✅ Badge status SOLID — tidak ada tint transparan */
const statusConfig = {
  approved: {
    label: 'Disetujui',
    icon: CheckCircle2,
    bg: 'bg-steel',
    text: 'text-white shadow-sm shadow-steel/30',
    dot: 'bg-steel',
  },
  pending: {
    label: 'Menunggu',
    icon: Clock,
    bg: 'bg-white border border-mist/60 shadow-sm',
    text: 'text-navy/70',
    dot: 'bg-navy',
  },
  revision: {
    label: 'Revisi',
    icon: AlertCircle,
    bg: 'bg-navy',
    text: 'text-white',
    dot: 'bg-navy',
  },
};

const categories = [
  'Frontend Development',
  'Backend Development',
  'UI/UX Design',
  'Testing',
  'Documentation',
  'Meeting',
  'Lainnya',
];

export const Logbook: React.FC<LogbookProps> = ({ 
  logs, 
  onAddLog, 
  isModalOpen, 
  setIsModalOpen,
  userRole
}) => {
  const { loadingResources, updateLogEntry } = useApp();
  const isLoading = loadingResources.has('logbook');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [hours, setHours] = useState(8);
  const [category, setCategory] = useState('Frontend Development');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHours, setEditHours] = useState(8);
  const [editCategory, setEditCategory] = useState('Frontend Development');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) return;
    setIsSubmitting(true);
    try {
      await onAddLog({ 
        title, 
        description: desc, 
        hours: Number(hours), 
        category 
      });
      setIsModalOpen(false);
      setTitle('');
      setDesc('');
      setHours(8);
      setCategory('Frontend Development');
    } catch (error) {
      console.error('Gagal menambah logbook', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !editTitle || !editDesc) return;
    setIsEditSubmitting(true);
    try {
      await updateLogEntry(editingLog.id, {
        title: editTitle,
        description: editDesc,
        hours: Number(editHours),
        category: editCategory,
      });
      setEditingLog(null);
      setEditTitle('');
      setEditDesc('');
      setEditHours(8);
      setEditCategory('Frontend Development');
    } catch (error) {
      console.error('Gagal update logbook', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const openEditModal = (log: LogEntry) => {
    setEditingLog(log);
    setEditTitle(log.title);
    setEditDesc(log.description);
    setEditHours(log.hours);
    setEditCategory(log.category);
  };

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const approved = logs.filter(l => l.status === 'approved').length;
  const pending = logs.filter(l => l.status === 'pending').length;
  const revision = logs.filter(l => l.status === 'revision').length;

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || 
             l.description.toLowerCase().includes(q) ||
             l.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4">

      {/* ── HEADER + STATS ── */}
      <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-navy flex items-center justify-center shadow-md shadow-navy/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-steel">Jurnal Magang</p>
              <h2 className="text-xl font-bold text-navy">Logbook PKL</h2>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel text-white px-5 py-2.5 rounded-[24px] text-sm font-bold flex items-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20 hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Jurnal
          </button>
        </div>

        {/* Stats — icon chip navy solid + icon putih */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {/* Total Jurnal */}
          <div className="bg-white border border-mist/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-navy tabular-nums leading-none">{logs.length}</span>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-3">Total Jurnal</p>
          </div>

          {/* Total Jam */}
          <div className="bg-white border border-mist/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-navy tabular-nums leading-none">
                {totalHours}
                <span className="text-sm text-navy/50 ml-0.5">j</span>
              </span>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-3">Total Jam</p>
          </div>

          {/* Disetujui */}
          <div className="bg-white border border-mist/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-navy tabular-nums leading-none">{approved}</span>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-3">Disetujui</p>
          </div>

          {/* Pending */}
          <div className="bg-white border border-mist/60 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-navy tabular-nums leading-none">{pending}</span>
                {revision > 0 && (
                  <span className="text-xs font-bold text-navy/50">+{revision}</span>
                )}
              </div>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-3">
              Pending{revision > 0 ? ' & Revisi' : ''}
            </p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5 pt-5 border-t border-mist/60">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari jurnal berdasarkan judul, deskripsi, atau kategori..."
              className="w-full bg-mist/40 border border-mist rounded-[24px] pl-10 pr-4 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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

          {/* ✅ Filter aktif = pill steel solid + teks putih (style switch) */}
          <div className="bg-mist/40 p-1 rounded-[24px] flex gap-1 shrink-0 overflow-x-auto">
            {([
              { key: 'all', label: 'Semua', count: logs.length },
              { key: 'approved', label: 'OK', count: approved },
              { key: 'pending', label: 'Pending', count: pending },
              { key: 'revision', label: 'Revisi', count: revision },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filter === f.key 
                    ? 'bg-steel text-white shadow' 
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                {f.label}
                <span className={`text-[10px] tabular-nums ${filter === f.key ? 'text-white/80' : 'text-navy/40'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOG LIST ── */}
      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        {isLoading && logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-steel animate-spin mb-3" />
            <p className="text-sm font-semibold text-navy/60">Memuat jurnal...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {search || filter !== 'all' ? (
              <>
                <div className="w-16 h-16 rounded-[10px] bg-navy flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-bold text-navy mb-1">Tidak ada hasil</p>
                <p className="text-sm text-navy/60 max-w-sm">
                  {search 
                    ? `Tidak ada jurnal yang cocok dengan "${search}". Coba kata kunci lain.`
                    : `Tidak ada jurnal dengan status ${filter === 'approved' ? 'disetujui' : filter === 'pending' ? 'pending' : 'revisi'}.`
                  }
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-[10px] bg-navy flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-bold text-navy mb-1">Mulai menulis jurnal pertama!</p>
                <p className="text-sm text-navy/60 max-w-sm mb-5">
                  Catat setiap aktivitas PKL kamu. Jurnal akan direview oleh mentor dan guru pembimbing.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md w-full mb-5">
                  <div className="bg-mist/30 rounded-[24px] p-3 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center mb-2">
                      <FileEdit className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] font-semibold text-navy/70 leading-tight">Tulis aktivitas harian</p>
                  </div>
                  <div className="bg-mist/30 rounded-[24px] p-3 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center mb-2">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] font-semibold text-navy/70 leading-tight">Pantau total jam kerja</p>
                  </div>
                  <div className="bg-mist/30 rounded-[24px] p-3 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] font-semibold text-navy/70 leading-tight">Dapatkan feedback mentor</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-steel text-white px-6 py-2.5 rounded-[24px] text-sm font-bold flex items-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20"
                >
                  <Plus className="w-4 h-4" /> Tulis Jurnal Pertama
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2.5">
            {filtered.map((log) => {
              const config = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedId === log.id;
              const isLong = log.description.length > 150;
              const logUserName = (log as any).userName as string | undefined;
              const logUserClass = (log as any).userClass as string | undefined;

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-[24px] border border-mist/60 hover:border-steel/30 hover:shadow-sm transition-all p-4 md:p-5 shrink-0 group"
                >
                  {/* ── Row 1: identitas + status ── */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* ✅ icon item: kotak rounded-lg navy solid + icon putih */}
                      <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm md:text-[15px] font-bold text-navy leading-snug line-clamp-1">
                          {log.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {userRole === 'teacher' && logUserName && (
                            <span className="text-[11px] font-bold text-white bg-navy px-2 py-0.5 rounded-md flex items-center gap-1">
                              <User className="w-3 h-3" />{logUserName}
                            </span>
                          )}
                          {userRole === 'teacher' && logUserClass && (
                            <span className="text-[11px] font-bold text-steel bg-white border border-steel/30 px-2 py-0.5 rounded-md shadow-sm">
                              {logUserClass}
                            </span>
                          )}
                          {(userRole !== 'teacher' || !logUserName) && (
                            <span className="text-[11px] font-bold text-navy/50 uppercase tracking-wide whitespace-nowrap">
                              {log.date}
                            </span>
                          )}
                          <span className="w-1 h-1 rounded-full bg-navy/20 shrink-0" />
                          {/* ✅ chip kategori: putih ber-border (bukan transparan) */}
                          <span className="text-[11px] font-bold text-steel bg-white border border-steel/30 px-2 py-0.5 rounded-md shadow-sm">
                            {log.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold bg-mist/60 text-navy/70 px-2.5 py-1 rounded-full flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />{log.hours}j
                      </span>
                      {/* ✅ badge status SOLID */}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${config.bg} ${config.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* ── Row 2: deskripsi (sejajar judul: w-8 + gap-3 = pl-11) ── */}
                  <div className="mt-3 md:pl-11">
                    <p className={`text-[13px] font-medium text-navy/70 leading-relaxed ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}>
                      {log.description}
                    </p>

                    {isLong && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="text-[11px] font-bold text-steel hover:text-steel/70 mt-1.5 transition-colors"
                      >
                        {isExpanded ? 'Tutup' : 'Baca selengkapnya'}
                      </button>
                    )}

                    {log.status === 'revision' && log.feedback && (
                      <div className="mt-3 p-3 bg-navy/10 border border-navy/15 rounded-2xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-navy mb-0.5">Catatan Revisi</p>
                            <p className="text-xs font-medium text-navy/80 leading-relaxed">{log.feedback}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {log.status === 'revision' && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => openEditModal(log)}
                          className="text-[11px] font-bold bg-navy text-white px-4 py-2 rounded-[24px] flex items-center gap-1.5 hover:bg-navy/90 transition-all shadow-md shadow-navy/20"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit & Revisi
                        </button>
                      </div>
                    )}

                    {log.status === 'approved' && log.feedback && (
                      <div className="mt-3 p-3 bg-steel/10 border border-mist rounded-2xl">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-steel mb-0.5">Feedback Mentor</p>
                            <p className="text-xs font-medium text-navy/70 leading-relaxed">{log.feedback}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editingLog && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-navy/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-mist/60">
            <div className="p-4 sm:p-6 border-b border-mist/60 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy">Revisi Jurnal</h3>
                    <p className="text-[12px] font-semibold text-navy/60 mt-0.5">Perbaiki jurnal sesuai catatan mentor</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingLog(null)} 
                  disabled={isEditSubmitting}
                  className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center text-navy/60 hover:text-navy transition-colors shrink-0 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-2">
                    Judul Aktivitas
                  </label>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)} 
                    placeholder="Misal: Membuat komponen dashboard PKL" 
                    required
                    disabled={isEditSubmitting}
                    className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40 disabled:opacity-50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-2">
                      Kategori
                    </label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      disabled={isEditSubmitting}
                      className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all disabled:opacity-50"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-2">
                      Durasi (Jam)
                    </label>
                    <input 
                      type="number" 
                      min="0.5" 
                      max="12" 
                      step="0.5"
                      value={editHours} 
                      onChange={e => setEditHours(Number(e.target.value))} 
                      required
                      disabled={isEditSubmitting}
                      className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all tabular-nums disabled:opacity-50" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide">
                      Deskripsi Aktivitas
                    </label>
                    <span className={`text-[11px] font-bold tabular-nums ${
                      editDesc.length > 500 ? 'text-navy' : editDesc.length > 400 ? 'text-steel' : 'text-navy/40'
                    }`}>
                      {editDesc.length}/500
                    </span>
                  </div>
                  <textarea 
                    rows={6} 
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value.slice(0, 500))} 
                    placeholder="Jelaskan secara detail apa yang kamu kerjakan hari ini, tantangan yang dihadapi, dan hasil yang dicapai..." 
                    required
                    disabled={isEditSubmitting}
                    className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none leading-relaxed placeholder:text-navy/40 disabled:opacity-50" 
                  />
                </div>

                {/* Feedback mentor */}
                {editingLog.feedback && (
                  <div className="bg-navy/10 border border-navy/15 rounded-[24px] p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-navy mb-0.5">Catatan Revisi Mentor</p>
                        <p className="text-xs font-medium text-navy/80 leading-relaxed">{editingLog.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-5 mt-5 border-t border-mist/60">
                <button 
                  type="button" 
                  onClick={() => setEditingLog(null)} 
                  disabled={isEditSubmitting}
                  className="flex-1 py-3 text-sm font-bold text-navy/70 hover:bg-mist/50 rounded-[24px] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isEditSubmitting || !editTitle || !editDesc}
                  className="flex-1 bg-navy text-white py-3 rounded-[24px] text-sm font-bold hover:bg-navy/90 transition-all shadow-lg shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Simpan Revisi</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-navy/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-mist/60">
            <div className="p-4 sm:p-6 border-b border-mist/60 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
                    <FileEdit className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy">Tambah Jurnal</h3>
                    <p className="text-[12px] font-semibold text-navy/60 mt-0.5">Catat aktivitasmu hari ini</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center text-navy/60 hover:text-navy transition-colors shrink-0 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-2">
                    Judul Aktivitas
                  </label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Misal: Membuat komponen dashboard PKL" 
                    required
                    disabled={isSubmitting}
                    className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40 disabled:opacity-50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-2">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all disabled:opacity-50"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide block mb-2">
                      Durasi (Jam)
                    </label>
                    <input 
                      type="number" 
                      min="0.5" 
                      max="12" 
                      step="0.5"
                      value={hours} 
                      onChange={e => setHours(Number(e.target.value))} 
                      required
                      disabled={isSubmitting}
                      className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all tabular-nums disabled:opacity-50" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide">
                      Deskripsi Aktivitas
                    </label>
                    <span className={`text-[11px] font-bold tabular-nums ${
                      desc.length > 500 ? 'text-navy' : desc.length > 400 ? 'text-steel' : 'text-navy/40'
                    }`}>
                      {desc.length}/500
                    </span>
                  </div>
                  <textarea 
                    rows={6} 
                    value={desc} 
                    onChange={e => setDesc(e.target.value.slice(0, 500))} 
                    placeholder="Jelaskan secara detail apa yang kamu kerjakan hari ini, tantangan yang dihadapi, dan hasil yang dicapai..." 
                    required
                    disabled={isSubmitting}
                    className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none leading-relaxed placeholder:text-navy/40 disabled:opacity-50" 
                  />
                </div>

                {/* Tips */}
                <div className="bg-steel/5 border border-steel/20 rounded-[24px] p-3 flex gap-2.5">
                  <Sparkles className="w-4 h-4 text-steel shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-steel mb-0.5">Tips menulis jurnal</p>
                    <p className="text-[11px] font-medium text-navy/70 leading-relaxed">
                      Gunakan format <span className="font-bold">STAR</span>: Situation, Task, Action, Result. Ini membantu mentor memahami progresmu dengan cepat.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-5 mt-5 border-t border-mist/60">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-sm font-bold text-navy/70 hover:bg-mist/50 rounded-[24px] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !title || !desc}
                  className="flex-1 bg-navy text-white py-3 rounded-[24px] text-sm font-bold hover:bg-navy/90 transition-all shadow-lg shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Simpan Jurnal</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};