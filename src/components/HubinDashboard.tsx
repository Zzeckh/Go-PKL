import React from 'react';
import { 
  Users, Building2, ShieldCheck, MapPin, Briefcase, GraduationCap, 
  ChevronRight, Clock, BookOpen, UserCheck, UserX, ClipboardList, CheckCircle2
} from 'lucide-react';
import { ActivePage } from '../types';
import { useApp } from '../context/AppContext';

interface HubinDashboardProps {
  userName?: string;
  schoolName: string;
  onNavigate?: (page: ActivePage) => void;
}

const getInitials = (name: string) => {
  if (!name || name === '-') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const HubinDashboard: React.FC<HubinDashboardProps> = ({ userName, schoolName, onNavigate }) => {
  const { 
    siswaList, perusahaanList, guruList, mentorList, 
    perizinanList, logEntries, attendances, mapLocations 
  } = useApp();

  /* ── Data dinamis ── */
  const todayString = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const hadirHariIni = attendances.filter(a => a.date === todayString && a.status === 'Hadir').length;
  const absenHariIni = attendances.filter(a => a.date === todayString).length;
  const belumAbsen = Math.max(0, siswaList.length - absenHariIni);
  const perizinanPending = perizinanList.filter(p => p.status === 'pending');
  const logbookPending = logEntries.filter(l => l.status === 'pending').length;

  const countSiswa = (companyName: string) =>
    siswaList.filter(s => s.perusahaan.toLowerCase() === companyName.toLowerCase()).length;

  const stats = [
    { icon: GraduationCap, label: 'Siswa Magang', value: siswaList.length, page: 'data-siswa' as ActivePage },
    { icon: Building2, label: 'Perusahaan Mitra', value: perusahaanList.length, page: 'pemetaan' as ActivePage },
    { icon: Users, label: 'Guru Pembimbing', value: guruList.length, page: 'data-pembimbing' as ActivePage },
    { icon: Briefcase, label: 'Mentor DUDI', value: mentorList.length, page: 'data-pembimbing' as ActivePage },
  ];

  const quickStats = [
    { icon: ClipboardList, label: 'Perizinan Pending', value: perizinanPending.length, color: perizinanPending.length > 0 ? 'text-[#9A6B15]' : 'text-navy' },
    { icon: BookOpen, label: 'Logbook Pending', value: logbookPending, color: logbookPending > 0 ? 'text-[#9A6B15]' : 'text-navy' },
    { icon: UserCheck, label: 'Hadir Hari Ini', value: hadirHariIni, color: 'text-steel' },
    { icon: UserX, label: 'Belum Absen', value: belumAbsen, color: belumAbsen > 0 ? 'text-[#BE123C]' : 'text-navy' },
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
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-[#F1F4F8] border border-[#E2E8F0] px-3 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* ── STATS CARDS (seragam #F1F4F8, clickable) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate && onNavigate(s.page)}
            className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-2xl p-4 text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group"
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-5 h-5 text-navy/50 group-hover:text-steel transition-colors" />
              <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-2xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mt-1.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── MAIN GRID (pola 3 + 2) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 min-h-0">

        {/* ══ LEFT: Distribusi Siswa per Perusahaan ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-steel/15 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-steel" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                Distribusi Siswa per Perusahaan
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

          {/* Mini peta sebaran */}
          <div className="mx-4 md:mx-5 mb-3 h-36 relative rounded-[20px] border border-navy/10 overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[#EDF1F7]">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <rect x="6" y="10" width="24" height="20" rx="2" fill="#E4F0F1" />
                <rect x="68" y="12" width="26" height="18" rx="2" fill="#E4F0F1" />
                <rect x="36" y="8" width="26" height="22" rx="2" fill="#E7EBF2" />
                <rect x="8" y="40" width="22" height="22" rx="2" fill="#E7EBF2" />
                <rect x="38" y="40" width="24" height="22" rx="2" fill="#E7EBF2" />
                <rect x="70" y="40" width="24" height="20" rx="2" fill="#E7EBF2" />
                <rect x="36" y="70" width="26" height="16" rx="2" fill="#E7EBF2" />
                <path d="M0,34 L100,34" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0,66 L100,66" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M32,0 L32,100" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M66,0 L66,100" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            {/* Pins dari mapLocations */}
            {mapLocations.map((loc, i) => (
              <div
                key={loc.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${loc.coordinates.x}%`, top: `${loc.coordinates.y}%` }}
              >
                {i === 0 && (
                  <span className="absolute inset-0 -m-1.5 rounded-full bg-steel/30 animate-ping pointer-events-none" />
                )}
                <div className={`relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                  i === 0 ? 'bg-steel' : 'bg-white'
                }`}>
                  <MapPin className={`w-3 h-3 ${i === 0 ? 'text-white' : 'text-navy/60'}`} />
                </div>
              </div>
            ))}

            {onNavigate && (
              <button
                onClick={() => onNavigate('maps')}
                className="absolute right-3 bottom-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-mist shadow-lg text-[11px] font-bold text-navy hover:bg-[#F1F4F8] transition-colors flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-steel" /> Buka Peta
              </button>
            )}
          </div>

          {/* List distribusi */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 min-h-0">
            {perusahaanList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F1F4F8] flex items-center justify-center mb-3">
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
                const pct = c.quota > 0 ? Math.min(100, Math.round((count / c.quota) * 100)) : 0;
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-mist/60 bg-white hover:border-steel/30 transition-all shrink-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F1F4F8] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-navy/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-navy truncate">{c.name}</p>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          Mentor: {c.mentor || 'Belum ditentukan'}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums shrink-0 ${
                        c.quota > 0 && count >= c.quota 
                          ? 'bg-[#FBF3E2] text-[#9A6B15]' 
                          : 'bg-steel/10 text-steel'
                      }`}>
                        {count}/{c.quota} siswa
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 bg-mist/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          c.quota > 0 && count >= c.quota ? 'bg-[#D99A21]' : 'bg-steel'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══ RIGHT: STACKED CARDS ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">

          {/* ── Card navy: identitas sekolah ── */}
          <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Koordinator Hubin</p>
                </div>
                <span className="text-[11px] font-bold bg-white/15 text-white px-3 py-1.5 rounded-full">
                  {userName || 'Admin'}
                </span>
              </div>

              <h4 className="font-bold text-base text-white leading-tight">{schoolName || 'Sekolah'}</h4>
              <p className="text-[13px] font-medium text-white/60 mt-1 leading-relaxed">
                Panel koordinasi, pemetaan & pengawasan program PKL
              </p>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-steel/20 border-steel/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-40" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-steel" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white leading-tight">Monitoring Aktif</p>
                      <p className="text-[11px] text-white/60 font-semibold">
                        {perusahaanList.length} mitra · {siswaList.length} siswa · {guruList.length} guru
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Card putih: quick stats 2x2 ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {quickStats.map((q) => (
                <div key={q.label} className="bg-[#F1F4F8] border border-[#E2E8F0] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <q.icon className="w-4 h-4 text-navy/50 shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-lg font-bold tabular-nums leading-none ${q.color}`}>{q.value}</p>
                    <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{q.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Card putih: perizinan menunggu (flex-1) ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm p-4 flex-1 flex flex-col min-h-[180px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-mist flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 text-navy" />
                </div>
                <p className="text-[13px] font-bold text-navy">Perizinan Menunggu</p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                perizinanPending.length > 0 ? 'bg-[#FBF3E2] text-[#9A6B15]' : 'bg-[#F1F4F8] text-navy/40'
              }`}>
                {perizinanPending.length} baru
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-0 pr-1">
              {perizinanPending.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#E4F0F1] flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-steel" />
                  </div>
                  <p className="text-xs font-bold text-navy">Semua perizinan sudah direview 🎉</p>
                  <p className="text-[11px] text-navy/50 mt-0.5">Tidak ada pengajuan menunggu</p>
                </div>
              ) : (
                perizinanPending.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl border border-mist/60 bg-white hover:border-steel/30 transition-all shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-navy truncate">{p.name}</p>
                        <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                          {p.company} · {p.date}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                        p.type === 'Sakit' ? 'bg-[#FDECEF] text-[#BE123C]' : 'bg-[#FBF3E2] text-[#9A6B15]'
                      }`}>
                        {p.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};