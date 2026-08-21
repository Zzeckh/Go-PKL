import React, { useState, useEffect } from 'react';
import { Users, Building, FileCheck, ChevronRight, Activity, Clock, Calendar, BookOpen, CheckCircle2, MessageSquare, AlertCircle, X, Loader2 } from 'lucide-react';
import { ActivePage } from '../types';
import { useApp } from '../context/AppContext';

interface MentorDashboardProps {
  userName: string;
  companyName: string;
  onNavigate?: (page: ActivePage) => void;
}

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ userName, companyName, onNavigate }) => {
  const { siswaList, logEntries, updateLogStatus } = useApp();

  const [time, setTime] = useState(new Date());
  const [revisionLogId, setRevisionLogId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingEntries = logEntries.filter(l => l.status === 'pending');

  const activeYear = siswaList.find(s => s.academicYear && s.academicYear !== '-')?.academicYear || '2025/2026';

  /* ── Kehadiran rata-rata siswa bimbingan ── */
  const avgAttendance = siswaList.length
    ? Math.round(siswaList.reduce((acc, s) => acc + (s.kehadiran || 0), 0) / siswaList.length)
    : 0;

  /* ── Logbook yang sudah diverifikasi ── */
  const approvedCount = logEntries.filter(l => l.status === 'approved').length;

  const stats = [
    { icon: Users, label: 'Total Siswa Magang', value: siswaList.length, page: 'attendance' as ActivePage },
    { icon: Activity, label: 'Kehadiran Rata-rata', value: `${avgAttendance}%`, page: 'attendance' as ActivePage },
    { icon: BookOpen, label: 'Logbook Pending', value: pendingEntries.length, page: 'logbook' as ActivePage },
    { icon: FileCheck, label: 'Logbook Terverifikasi', value: approvedCount, page: 'logbook' as ActivePage },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Building className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Selamat Datang, {userName.split(',')[0].trim()}
            </h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {companyName || 'Pembimbing Industri'} · Pantau siswa magang
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-shell border border-mist px-3 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 border border-steel/20 px-3 py-2 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            TA {activeYear}
          </span>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate && onNavigate(s.page)}
            className="bg-white border border-mist/60 rounded-[24px] p-5 text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-[10px] bg-shell flex items-center justify-center group-hover:bg-steel/10 transition-colors">
                <s.icon className="w-5 h-5 text-navy/60 group-hover:text-steel transition-colors" />
              </div>
              <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-2">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── MAIN GRID (3 + 2) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">

        {/* ══ LEFT: Logbook Pending Review ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-[380px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-steel" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                Review Logbook ({pendingEntries.length})
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('logbook')}
              className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1"
            >
              Logbook <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 min-h-0">
            {pendingEntries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-[10px] bg-steel/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-steel" />
                </div>
                <p className="text-sm font-bold text-navy mb-1">Semua logbook telah ditinjau</p>
                <p className="text-xs text-navy/50 max-w-xs">
                  Tidak ada jurnal harian yang menunggu persetujuan.
                </p>
              </div>
            ) : (
              pendingEntries.map(log => (
                <div key={log.id} className="p-3 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 transition-all shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(log.title.split(' ')[0] || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy truncate">{log.title}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {log.date} · {log.hours} jam
                      </p>
                      <p className="text-xs font-medium text-navy/70 mt-1.5 leading-relaxed line-clamp-2">{log.description}</p>
                    </div>
                  </div>
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══ RIGHT: Informasi + Catatan ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
          <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-white/15 flex items-center justify-center">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                    Tempat
                  </p>
                </div>
                <span className="text-[11px] font-bold bg-white/15 text-white px-3 py-1.5 rounded-full tabular-nums">
                  {siswaList.length} siswa
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-white/15 border border-white/10 flex items-center justify-center font-bold text-base text-white shrink-0">
                  {getInitials(companyName) || 'M'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base text-white leading-tight truncate">
                    {companyName || 'Perusahaan'}
                  </p>
                  <p className="text-[12px] font-semibold text-white/60 mt-0.5 truncate">
                    Pembimbing Industri · {userName.split(',')[0].trim()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Card Catatan Mentor ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center gap-2 p-5 pb-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-mist/70 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-navy" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Catatan</p>
                <p className="text-sm font-bold text-navy leading-tight mt-0.5">Catatan Mentor</p>
              </div>
            </div>
            <div className="flex-1 px-5 pb-5 min-h-0">
              <div className="w-full h-full overflow-y-auto custom-scrollbar text-[13px] font-medium text-navy/70 whitespace-pre-line leading-relaxed bg-shell/60 border border-mist/60 rounded-[24px] p-3">
                - Briefing siswa magang setiap Senin pagi
                - Verifikasi logbook harian siswa
                - Koordinasi dengan guru pembimbing sekolah
                <span className="block mt-2 text-xs text-navy/40 italic">Review logbook dapat diakses dari menu Logbook.</span>
              </div>
            </div>
          </div>
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
