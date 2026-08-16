import React, { useState } from 'react';
import { 
  Plus, BookOpen, CheckCircle2, Clock, X, Search, 
  AlertCircle, Loader2, Sparkles, FileEdit 
} from 'lucide-react';
import { LogEntry } from '../types';
import { useApp } from '../context/AppContext';

interface LogbookProps {
  logs: LogEntry[];
  onAddLog: (log: Omit<LogEntry, 'id' | 'date' | 'status'>) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
}

type FilterType = 'all' | 'approved' | 'pending' | 'revision';

const statusConfig = {
  approved: {
    label: 'Disetujui',
    icon: CheckCircle2,
    bg: 'bg-[#E4F0F1]',
    text: 'text-steel',
    dot: 'bg-steel',
  },
  pending: {
    label: 'Menunggu',
    icon: Clock,
    bg: 'bg-[#FBF3E2]',
    text: 'text-[#9A6B15]',
    dot: 'bg-[#D99A21]',
  },
  revision: {
    label: 'Revisi',
    icon: AlertCircle,
    bg: 'bg-[#FDECEF]',
    text: 'text-[#BE123C]',
    dot: 'bg-[#E11D48]',
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
  setIsModalOpen 
}) => {
  const { loadingResources } = useApp();
  const isLoading = loadingResources.has('logbook');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [hours, setHours] = useState(8);
  const [category, setCategory] = useState('Frontend Development');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
            <div className="w-11 h-11 rounded-2xl bg-navy flex items-center justify-center shadow-md shadow-navy/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-steel">Jurnal Magang</p>
              <h2 className="text-xl font-bold text-navy">Logbook PKL</h2>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-steel text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20 hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Jurnal
          </button>
        </div>

        {/* Stats — semua card seragam #F1F4F8 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {/* Total Jurnal */}
          <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <BookOpen className="w-4 h-4 text-navy/50" />
              <span className="text-2xl font-bold text-navy tabular-nums">{logs.length}</span>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide">Total Jurnal</p>
          </div>

          {/* Total Jam */}
          <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-4 h-4 text-navy/50" />
              <span className="text-2xl font-bold text-navy tabular-nums">
                {totalHours}
                <span className="text-sm text-navy/50 ml-0.5">j</span>
              </span>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide">Total Jam</p>
          </div>

          {/* Disetujui */}
          <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle2 className="w-4 h-4 text-navy/50" />
              <span className="text-2xl font-bold text-navy tabular-nums">{approved}</span>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide">Disetujui</p>
          </div>

          {/* Pending */}
          <div className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <AlertCircle className="w-4 h-4 text-navy/50" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-navy tabular-nums">{pending}</span>
                {revision > 0 && (
                  <span className="text-xs font-bold text-navy/50">+{revision}</span>
                )}
              </div>
            </div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide">
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
              className="w-full bg-mist/40 border border-mist rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40"
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

          <div className="bg-mist/40 p-1 rounded-xl flex gap-1 shrink-0 overflow-x-auto">
            {([
              { key: 'all', label: 'Semua', count: logs.length },
              { key: 'approved', label: 'OK', count: approved },
              { key: 'pending', label: 'Pending', count: pending },
              { key: 'revision', label: 'Revisi', count: revision },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filter === f.key 
                    ? 'bg-white text-navy shadow-sm' 
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                {f.label}
                <span className={`text-[10px] tabular-nums ${filter === f.key ? 'text-steel' : 'text-navy/40'}`}>
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
                <div className="w-16 h-16 rounded-2xl bg-mist/50 flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-navy/30" />
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
                <div className="w-16 h-16 rounded-2xl bg-steel/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-steel" />
                </div>
                <p className="text-base font-bold text-navy mb-1">Mulai menulis jurnal pertama!</p>
                <p className="text-sm text-navy/60 max-w-sm mb-5">
                  Catat setiap aktivitas PKL kamu. Jurnal akan direview oleh mentor dan guru pembimbing.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md w-full mb-5">
                  <div className="bg-mist/30 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-2">
                      <FileEdit className="w-4 h-4 text-steel" />
                    </div>
                    <p className="text-[11px] font-semibold text-navy/70 leading-tight">Tulis aktivitas harian</p>
                  </div>
                  <div className="bg-mist/30 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-2">
                      <Clock className="w-4 h-4 text-steel" />
                    </div>
                    <p className="text-[11px] font-semibold text-navy/70 leading-tight">Pantau total jam kerja</p>
                  </div>
                  <div className="bg-mist/30 rounded-xl p-3 flex flex-col items-center text-center">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-4 h-4 text-steel" />
                    </div>
                    <p className="text-[11px] font-semibold text-navy/70 leading-tight">Dapatkan feedback mentor</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-steel text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-steel/90 transition-all shadow-md shadow-steel/20"
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

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl border border-mist/60 hover:border-steel/30 hover:shadow-sm transition-all p-4 shrink-0 group"
                >
                  <div className="flex gap-3">
                    {/* Icon + Date */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-navy/50 uppercase tracking-wider whitespace-nowrap">
                        {log.date.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="text-sm font-bold text-navy leading-snug pr-2 line-clamp-2">
                          {log.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-bold bg-mist/60 text-navy/70 px-2 py-1 rounded-full flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3" />{log.hours}j
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${config.bg} ${config.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-steel bg-steel/10 px-2 py-0.5 rounded-md">
                          {log.category}
                        </span>
                      </div>

                      <p className={`text-[13px] font-medium text-navy/70 leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}>
                        {log.description}
                      </p>

                      {isLong && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="text-[11px] font-bold text-steel hover:text-steel/70 mt-1 transition-colors"
                        >
                          {isExpanded ? 'Tutup' : 'Baca selengkapnya'}
                        </button>
                      )}

                      {log.status === 'revision' && log.feedback && (
                        <div className="mt-3 p-3 bg-[#FDECEF] border border-[#F5D0D9] rounded-xl">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-[#BE123C] shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-[#BE123C] mb-0.5">Catatan Revisi</p>
                              <p className="text-xs font-medium text-[#881337]/80 leading-relaxed">{log.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {log.status === 'approved' && log.feedback && (
                        <div className="mt-3 p-3 bg-[#E4F0F1] border border-[#CBE2E4] rounded-xl">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-mist/60">
            <div className="p-5 md:p-6 border-b border-mist/60 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
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
                  className="w-9 h-9 rounded-xl bg-mist/60 hover:bg-mist flex items-center justify-center text-navy/60 hover:text-navy transition-colors shrink-0 disabled:opacity-50"
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
                    className="w-full bg-mist/30 border border-mist rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all placeholder:text-navy/40 disabled:opacity-50" 
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
                      className="w-full bg-mist/30 border border-mist rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all disabled:opacity-50"
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
                      className="w-full bg-mist/30 border border-mist rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-steel focus:bg-white transition-all tabular-nums disabled:opacity-50" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-navy/70 uppercase tracking-wide">
                      Deskripsi Aktivitas
                    </label>
                    <span className={`text-[11px] font-bold tabular-nums ${
                      desc.length > 500 ? 'text-[#BE123C]' : desc.length > 400 ? 'text-[#9A6B15]' : 'text-navy/40'
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
                    className="w-full bg-mist/30 border border-mist rounded-xl px-4 py-3 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none leading-relaxed placeholder:text-navy/40 disabled:opacity-50" 
                  />
                </div>

                {/* Tips */}
                <div className="bg-steel/5 border border-steel/20 rounded-xl p-3 flex gap-2.5">
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
                  className="flex-1 py-3 text-sm font-bold text-navy/70 hover:bg-mist/50 rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !title || !desc}
                  className="flex-1 bg-navy text-white py-3 rounded-xl text-sm font-bold hover:bg-navy/90 transition-all shadow-lg shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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