import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, CheckCircle2, MessageSquare, Clock, AlertCircle, Loader2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   VERIFIKASI LOGBOOK SISWA (MENTOR)
   ✅ Filter steel solid, badge solid, chip navy
   ══════════════════════════════════════════════════════ */
export const MentorLogbook: React.FC = () => {
  const { logEntries, updateLogStatus } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revision'>('all');
  const [search, setSearch] = useState('');
  const [revisionLogId, setRevisionLogId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const filtered = useMemo(
    () => logEntries.filter(l =>
      (filter === 'all' || l.status === filter) &&
      l.title.toLowerCase().includes(search.toLowerCase())
    ),
    [logEntries, filter, search]
  );

  const pendingCount = logEntries.filter(l => l.status === 'pending').length;
  const approvedCount = logEntries.filter(l => l.status === 'approved').length;
  const revisionCount = logEntries.filter(l => l.status === 'revision').length;

  const statusLabel = (s: string) =>
    s === 'approved' ? 'Disetujui' : s === 'revision' ? 'Revisi' : 'Menunggu';

  /* ✅ Badge status SOLID — tanpa tint transparan */
  const statusPill = (s: string) =>
    s === 'approved' ? 'bg-steel text-white shadow-sm shadow-steel/30'
    : s === 'revision' ? 'bg-navy text-white'
    : 'bg-white text-navy/70 border border-mist/60 shadow-sm';

  const tabs = [
    { key: 'all' as const, label: 'Semua', count: logEntries.length },
    { key: 'pending' as const, label: 'Menunggu', count: pendingCount },
    { key: 'approved' as const, label: 'Disetujui', count: approvedCount },
    { key: 'revision' as const, label: 'Revisi', count: revisionCount },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      {/* ── HEADER  */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Verifikasi Logbook</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Tinjau jurnal harian siswa magang milik Anda
            </p>
          </div>
        </div>
        {/* ✅ chip pending: card putih ber-border steel */}
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-steel bg-white border border-steel/30 shadow-sm px-3 py-2 rounded-full">
          <Clock className="w-3.5 h-3.5" /> {pendingCount} menunggu
        </span>
      </div>

      {/* ── FILTER + SEARCH ─ */}
      <div className="shrink-0 space-y-3">
        {/* ✅ track mist/40, aktif = steel solid + teks putih */}
        <div className="bg-mist/40 p-1 rounded-[24px] flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filter === t.key ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-bold tabular-nums ${
                filter === t.key ? 'text-white/80' : 'text-navy/40'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul logbook..."
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

      {/* ── LIST LOGBOOK ── */}
      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {/* ✅ empty state: navy solid + icon putih */}
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Tidak ada logbook</p>
              <p className="text-xs text-navy/50">Belum ada jurnal yang cocok dengan filter ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(log => (
                <div key={log.id} className="p-3.5 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                      {log.userName ? getInitials(log.userName) : getInitials(log.title.split(' ')[0] || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-navy truncate">{log.title}</p>
                        {/* ✅ badge status SOLID */}
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusPill(log.status)}`}>
                          {statusLabel(log.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {log.userName && (
                          /* ✅ chip nama siswa: navy solid + teks putih */
                          <span className="text-[11px] font-bold text-white bg-navy px-2 py-0.5 rounded-md flex items-center gap-1">
                            <User className="w-3 h-3" />{log.userName}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-navy/50">
                          {log.date} · {log.hours} jam · {log.category}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-xs font-medium text-navy/70 mt-1.5 leading-relaxed">{log.description}</p>
                      )}
                    </div>
                  </div>
                  {log.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 mt-3 border-t border-mist/60 pt-2.5">
                      <button
                        onClick={() => { setRevisionLogId(log.id); setRevisionFeedback(''); }}
                        className="text-[11px] font-bold bg-white border border-mist text-navy/70 px-3 py-1.5 rounded-lg hover:border-steel/40 hover:text-navy transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Revisi
                      </button>
                      <button
                        onClick={() => updateLogStatus(log.id, 'approved')}
                        className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1.5 shadow-sm shadow-steel/25"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL REVISI ── */}
      {revisionLogId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 overflow-hidden">
            <div className="p-5 border-b border-mist/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Catatan Revisi</h3>
                  <p className="text-[11px] font-semibold text-navy/60">Jelaskan apa yang perlu diperbaiki</p>
                </div>
              </div>
              <button
                onClick={() => setRevisionLogId(null)}
                disabled={isSubmittingRevision}
                className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center text-navy/60 hover:text-navy transition-colors shrink-0 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-2 bg-navy/5 border border-navy/10 rounded-[24px] p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-navy/80 leading-relaxed">
                  Feedback ini akan ditampilkan kepada siswa sebagai catatan revisi pada logbook mereka.
                </p>
              </div>
              <textarea
                rows={4}
                value={revisionFeedback}
                onChange={e => setRevisionFeedback(e.target.value)}
                placeholder="Contoh: Deskripsi aktivitas kurang detail, tambahkan tantangan dan hasil yang dicapai..."
                disabled={isSubmittingRevision}
                className="w-full bg-mist/30 border border-mist rounded-[24px] px-4 py-3 text-sm font-medium text-navy outline-none focus:border-steel focus:bg-white transition-all resize-none leading-relaxed placeholder:text-navy/40 disabled:opacity-50"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setRevisionLogId(null)}
                  disabled={isSubmittingRevision}
                  className="flex-1 py-2.5 text-sm font-bold text-navy/70 hover:bg-mist/50 rounded-[24px] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    if (!revisionFeedback.trim()) return;
                    setIsSubmittingRevision(true);
                    try {
                      await updateLogStatus(revisionLogId, 'rejected', revisionFeedback.trim());
                      setRevisionLogId(null);
                      setRevisionFeedback('');
                    } catch (err) {
                      console.error('Gagal merevisi logbook', err);
                    } finally {
                      setIsSubmittingRevision(false);
                    }
                  }}
                  disabled={isSubmittingRevision || !revisionFeedback.trim()}
                  className="flex-1 bg-navy text-white py-2.5 rounded-[24px] text-sm font-bold hover:bg-navy/90 transition-all shadow-lg shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingRevision ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                  ) : (
                    <><MessageSquare className="w-4 h-4" /> Kirim Revisi</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};