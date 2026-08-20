import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, ShieldCheck, GraduationCap, 
  ChevronRight, Clock, BookOpen, Briefcase,
  Play, Pause, Square, Edit2, Check, Calendar
} from 'lucide-react';
import { ActivePage } from '../types';
import { useApp } from '../context/AppContext';

interface HubinDashboardProps {
  userName?: string;
  schoolName: string;
  onNavigate?: (page: ActivePage) => void;
}

export const HubinDashboard: React.FC<HubinDashboardProps> = ({ schoolName, onNavigate }) => {
  const { siswaList, perusahaanList, guruList, mentorList } = useApp();

  /* ── Tahun akademik aktif ── */
  const activeYear = siswaList.find(s => s.academicYear && s.academicYear !== '-')?.academicYear || '2025/2026';

  /* ── Clock / Stopwatch ── */
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<'clock' | 'sw'>('clock');
  const [sw, setSw] = useState(0);
  const [swRun, setSwRun] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!swRun) return;
    const t = setInterval(() => setSw(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [swRun]);

  const fmtSw = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  /* ── Notes (edit mode) ── */
  const [notes, setNotes] = useState('- Koordinasikan kunjungan industri minggu depan\n- Update data perusahaan mitra\n- Cek penempatan siswa kelas XII TKJ');
  const [editNotes, setEditNotes] = useState(false);

  const countSiswa = (companyName: string) =>
    siswaList.filter(s => s.perusahaan.toLowerCase() === companyName.toLowerCase()).length;

  const getDominantClass = (companyName: string) => {
    const siswa = siswaList.filter(s => s.perusahaan.toLowerCase() === companyName.toLowerCase());
    if (siswa.length === 0) return null;
    const classCount: Record<string, number> = {};
    siswa.forEach(s => {
      if (s.kelas && s.kelas !== '-') {
        classCount[s.kelas] = (classCount[s.kelas] || 0) + 1;
      }
    });
    const entries = Object.entries(classCount);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  const stats = [
    { icon: GraduationCap, label: 'Siswa Magang', value: siswaList.length, page: 'data-siswa' as ActivePage },
    { icon: Building2, label: 'Perusahaan Mitra', value: perusahaanList.length, page: 'pemetaan' as ActivePage },
    { icon: Users, label: 'Guru Pembimbing', value: guruList.length, page: 'data-pembimbing' as ActivePage },
    { icon: Briefcase, label: 'Mentor DUDI', value: mentorList.length, page: 'data-pembimbing' as ActivePage },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-2xl flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Panel Pengawasan Hubin
            </h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {schoolName || 'Sekolah'} · Koordinasi & pemetaan PKL
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

      {/* ── STATS CARDS (putih, lebih tinggi) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate && onNavigate(s.page)}
            className="bg-white border border-mist/60 rounded-[24px] p-5 text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-shell flex items-center justify-center group-hover:bg-steel/10 transition-colors">
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

        {/* ══ LEFT: List Perusahaan Mitra ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-[380px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-steel" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                Perusahaan Mitra
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('pemetaan')}
                className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1"
              >
                Kelola Pemetaan <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 min-h-0">
            {perusahaanList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-shell flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-navy/30" />
                </div>
                <p className="text-sm font-bold text-navy mb-1">Belum ada perusahaan mitra</p>
                <p className="text-xs text-navy/50 max-w-xs">
                  Tambahkan perusahaan dan petakan siswa melalui halaman pemetaan.
                </p>
              </div>
            ) : (
              perusahaanList.map((c) => {
                const count = countSiswa(c.name) || c.filled;
                const dominantClass = getDominantClass(c.name);
                return (
                  <button
                    key={c.id}
                    onClick={() => onNavigate && onNavigate('pemetaan')}
                    className="p-3 rounded-xl border border-mist/60 bg-white hover:border-steel/30 hover:bg-shell/50 transition-all shrink-0 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-steel/10 flex items-center justify-center shrink-0 group-hover:bg-steel/20 transition-colors">
                        <Building2 className="w-5 h-5 text-steel" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-navy truncate">{c.name}</p>
                          {dominantClass && (
                            <span className="text-[10px] font-bold text-navy/60 bg-shell border border-mist px-2 py-0.5 rounded-md shrink-0">
                              {dominantClass}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          Mentor: {c.mentor || 'Belum ditentukan'} · {c.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                          c.quota > 0 && count >= c.quota 
                            ? 'bg-steel/10 text-steel' 
                            : 'bg-steel/10 text-steel'
                        }`}>
                          {count} siswa
                        </span>
                        <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══ RIGHT: Clock + Notes ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">

          {/* ── Card Jam / Stopwatch ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
            <div className="flex gap-1 bg-mist/60 p-1 rounded-full mb-2">
              <button 
                onClick={() => setMode('clock')} 
                className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${mode === 'clock' ? 'bg-steel text-white shadow' : 'text-navy/60'}`}
              >
                Jam
              </button>
              <button 
                onClick={() => setMode('sw')} 
                className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${mode === 'sw' ? 'bg-steel text-white shadow' : 'text-navy/60'}`}
              >
                Stopwatch
              </button>
            </div>

            {mode === 'clock' ? (
              <div className="flex flex-col items-center justify-center py-4">
                <span className="text-4xl md:text-5xl font-light text-navy font-mono tabular-nums leading-none">
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-sm font-bold text-steel mt-2 tabular-nums">
                  :{String(time.getSeconds()).padStart(2, '0')}
                </span>
                <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-navy/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{time.toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <span className="text-4xl md:text-5xl font-light text-navy font-mono tabular-nums">{fmtSw(sw)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSwRun(!swRun)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-105 border ${swRun ? 'bg-white border-mist text-navy' : 'bg-steel border-steel text-white'}`}
                  >
                    {swRun ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    onClick={() => { setSwRun(false); setSw(0); }}
                    className="w-10 h-10 rounded-full bg-white border border-mist flex items-center justify-center text-navy/70 hover:bg-mist/50 transition-all hover:scale-105 shadow-sm"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Card Notes (edit mode, flex-1) ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col min-h-[220px] flex-1">
            <div className="flex items-center justify-between p-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-mist/70 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-navy" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Catatan</p>
                  <p className="text-sm font-bold text-navy leading-tight mt-0.5">Notes Hubin</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editNotes && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-steel bg-steel/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-steel animate-pulse" />
                    Mode Edit
                  </span>
                )}
                <button
                  onClick={() => setEditNotes(!editNotes)}
                  title={editNotes ? 'Simpan catatan' : 'Edit catatan'}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${editNotes ? 'bg-navy text-white border-navy shadow-md shadow-navy/30' : 'bg-white text-navy/60 border-mist hover:border-steel hover:text-steel'}`}
                >
                  {editNotes ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex-1 px-5 pb-5 min-h-0 flex flex-col">
              {editNotes ? (
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  autoFocus
                  className="w-full flex-1 min-h-[120px] text-sm font-medium text-navy bg-shell/60 border border-mist focus:border-steel rounded-xl p-3 outline-none resize-none leading-relaxed placeholder:text-navy/40 transition-all"
                  placeholder="Ketik catatan koordinasi..."
                />
              ) : (
                <div className="w-full flex-1 min-h-[120px] overflow-y-auto custom-scrollbar text-sm font-medium text-navy/80 whitespace-pre-line leading-relaxed">
                  {notes || <span className="text-navy/40 italic text-xs">Belum ada catatan.</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};