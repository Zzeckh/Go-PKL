import React, { useState } from 'react';
import { Plus, BookOpen, CheckCircle2, Clock, X } from 'lucide-react';
import { LogEntry } from '../types';

interface LogbookProps {
  logs: LogEntry[];
  onAddLog: (log: Omit<LogEntry, 'id' | 'date' | 'status'>) => void;
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
}

export const Logbook: React.FC<LogbookProps> = ({ logs, onAddLog, isModalOpen, setIsModalOpen }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [hours, setHours] = useState(8);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) return;
    onAddLog({ title, description: desc, hours: Number(hours), category: 'Frontend Development' });
    setIsModalOpen(false);
    setTitle('');
    setDesc('');
  };

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const approved = logs.filter(l => l.status === 'approved').length;
  const pending = logs.filter(l => l.status === 'pending').length;
  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  return (
    <div className="h-full w-full flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="c0 shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/50">Jurnal Magang</p>
            <h2 className="text-xl font-bold text-black">Logbook PKL</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black/80 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Jurnal
          </button>
        </div>

        {/* Stats + Filter */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-black/5">
          <div className="flex gap-3 flex-1">
            {[
              { label: 'Jurnal', val: logs.length },
              { label: 'Total Jam', val: `${totalHours}j` },
              { label: 'Disetujui', val: approved },
              { label: 'Pending', val: pending },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-white/60 border border-white rounded-2xl p-3 text-center min-w-0">
                <p className="text-lg font-bold text-black tabular-nums leading-none">{s.val}</p>
                <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-black/5 p-1 rounded-2xl flex gap-1 shrink-0">
            {(['all', 'approved', 'pending'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-black text-white shadow' : 'text-black/60 hover:text-black'}`}
              >
                {f === 'all' ? 'Semua' : f === 'approved' ? 'Approved' : 'Pending'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Log List ── */}
      <div className="c1 flex-1 bg-white/40 backdrop-blur-md rounded-[24px] border border-white/60 shadow-sm overflow-hidden flex flex-col p-4">
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
          {filtered.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-black/40">
              <BookOpen className="w-10 h-10 mb-3 opacity-25" />
              <p className="text-sm font-semibold">Belum ada jurnal</p>
            </div>
          )}
          {filtered.map((log, i) => (
            <div
              key={log.id}
              className="bg-white/90 rounded-[24px] border border-white shadow-sm hover:shadow-md hover:border-black/10 transition-all duration-250 p-5 flex gap-4 shrink-0 group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center shrink-0 group-hover:bg-black transition-colors duration-300">
                <BookOpen className="w-5 h-5 text-black/50 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-black truncate">{log.title}</h3>
                    <p className="text-xs font-semibold text-black/50 mt-1">{log.date} · {log.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold bg-black/5 text-black/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />{log.hours}j
                    </span>
                    {log.status === 'approved' ? (
                      <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OK
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-black/10 text-black/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs font-medium text-black/70 leading-relaxed mt-2 line-clamp-2">{log.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-2xl w-full h-[85vh] max-h-[620px] shadow-2xl flex flex-col overflow-hidden border border-black/10">
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-black/5">
                <div>
                  <h3 className="text-lg font-bold text-black">Tambah Jurnal</h3>
                  <p className="text-xs font-semibold text-black/50 mt-1">Catat aktivitasmu hari ini</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 hover:bg-black/10 hover:text-black transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase tracking-wide block mb-1.5">Judul Aktivitas</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Membuat rancangan UI/UX" required
                    className="w-full bg-black/5 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase tracking-wide block mb-1.5">Durasi (Jam)</label>
                  <input type="number" min="1" max="24" value={hours} onChange={e => setHours(Number(e.target.value))} required
                    className="w-full bg-black/5 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase tracking-wide block mb-1.5">Deskripsi</label>
                  <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detail aktivitas hari ini..." required
                    className="w-full bg-black/5 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:bg-white transition-all resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-black/5 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-xs font-bold text-black/60 hover:bg-black/5 hover:text-black rounded-2xl transition-colors">Batal</button>
                  <button type="submit" className="flex-1 bg-black text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-black/80 transition-all hover:-translate-y-0.5 shadow-md">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
