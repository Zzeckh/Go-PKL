import React, { useState, useEffect } from 'react';
import { Users, Building, FileCheck, ChevronRight, Activity, Clock, Calendar, BookOpen } from 'lucide-react';
import { ActivePage } from '../types';
import { useApp } from '../context/AppContext';
import { DashboardCharts } from './DashboardCharts';

interface TeacherDashboardProps {
  userName: string;
  schoolName: string;
  onNavigate?: (page: ActivePage) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ userName, schoolName, onNavigate }) => {
  const { siswaList, perusahaanList, perizinanList } = useApp();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Tahun akademik aktif ── */
  const activeYear = siswaList.find(s => s.academicYear && s.academicYear !== '-')?.academicYear || '2025/2026';

  /* ── Perizinan menunggu verifikasi (data benar untuk guru) ── */
  const pendingPermissions = perizinanList.filter(p => p.status === 'pending').length;

  /* ── Perusahaan dari siswa yang dibimbing ── */
  const companyMap = new Map<string, { students: string[] }>();
  siswaList.forEach(s => {
    if (s.perusahaan && s.perusahaan !== '-') {
      if (!companyMap.has(s.perusahaan)) companyMap.set(s.perusahaan, { students: [] });
      companyMap.get(s.perusahaan)!.students.push(s.name);
    }
  });

  const myCompanies = Array.from(companyMap.entries())
    .map(([name, { students }]) => ({
      id: name,
      name,
      students: students.length,
      attendance: Math.round(students.length ? students.reduce((acc, sn) => acc + (siswaList.find(x => x.name === sn)?.kehadiran || 0), 0) / students.length : 0),
    }));

  /* ── Kehadiran rata-rata ── */
  const avgAttendance = siswaList.length
    ? Math.round(siswaList.reduce((acc, s) => acc + (s.kehadiran || 0), 0) / siswaList.length)
    : 0;

  const stats = [
    { icon: Users, label: 'Total Bimbingan', value: siswaList.length, page: 'monitoring' as ActivePage },
    { icon: Building, label: 'Perusahaan Mitra', value: perusahaanList.length, page: 'monitoring' as ActivePage },
    { icon: Activity, label: 'Kehadiran Rata-rata', value: `${avgAttendance}%`, page: 'monitoring' as ActivePage },
    { icon: FileCheck, label: 'Verifikasi Perizinan', value: pendingPermissions, page: 'perizinan' as ActivePage },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">
              Selamat Datang, {userName.split(',')[0].trim()}
            </h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {schoolName || 'Guru Pembimbing'} · Pantau anak bimbingan PKL
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* ✅ chip tanggal: bg mist/40 (seperti search bar Logbook) */}
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-navy/60 bg-mist/40 border border-mist px-3 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          {/* ✅ chip TA: card putih ber-border steel */}
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-steel bg-white border border-steel/30 shadow-sm px-3 py-2 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            TA {activeYear}
          </span>
        </div>
      </div>

      {/* ── STATS CARDS — icon chip navy solid + icon putih ── */}
      <DashboardCharts role="teacher" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate && onNavigate(s.page)}
            className="bg-white border border-mist/60 rounded-[24px] p-5 text-left transition-all hover:border-steel/40 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <s.icon className="w-4 h-4 text-white" />
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
      <div className="lg:flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 lg:min-h-0">

        {/* ══ LEFT: Rekapitulasi Distribusi Siswa ══ */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-[380px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* ✅ chip navy solid + icon putih */}
              <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center">
                <Building className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-navy/70">
                Distribusi Anak Bimbingan
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('monitoring')}
              className="text-[11px] font-bold bg-steel text-white px-3 py-1.5 rounded-lg hover:bg-steel/90 transition-colors flex items-center gap-1"
            >
              Monitoring <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="lg:flex-1 overflow-y-auto custom-scrollbar px-4 md:px-5 pb-4 flex flex-col gap-2 lg:min-h-0 max-h-[50vh] lg:max-h-none">
            {myCompanies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                {/* ✅ empty state: navy solid + icon putih */}
                <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold text-navy mb-1">Belum ada distribusi</p>
                <p className="text-xs text-navy/50 max-w-xs">
                  Siswa yang dipetakan ke tempat PKL akan tampil di sini.
                </p>
              </div>
            ) : (
              myCompanies.map((company) => (
                <div
                  key={company.id}
                  className="p-3 rounded-[24px] border border-mist/60 bg-white hover:border-steel/30 hover:bg-mist/30 transition-all shrink-0 text-left group"
                >
                  <div className="flex items-center gap-3">
                    {/* ✅ icon item: navy solid + icon putih */}
                    <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy truncate">{company.name}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {siswaList.filter(s => s.perusahaan === company.name).length} siswa ditempatkan
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* ✅ badge kehadiran: SOLID steel */}
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-steel text-white shadow-sm shadow-steel/30 tabular-nums">
                        {company.attendance}% hadir
                      </span>
                      <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══ RIGHT: Catatan + Informasi ══ */}
        <div className="lg:col-span-2 flex flex-col gap-3 lg:min-h-0">
          <div className="bg-navy rounded-[24px] p-5 shrink-0 relative overflow-hidden shadow-lg shadow-navy/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                    Tempat
                  </p>
                </div>
                <span className="text-[11px] font-bold bg-white/15 text-white px-3 py-1.5 rounded-full tabular-nums">
                  {siswaList.length} total
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-white/15 border border-white/10 flex items-center justify-center font-bold text-base text-white shrink-0">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'G'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base text-white leading-tight truncate">
                    {userName.split(',')[0].trim() || 'Guru Pembimbing'}
                  </p>
                  <p className="text-[12px] font-semibold text-white/60 mt-0.5 truncate">
                    {schoolName || 'Sekolah'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Card Catatan Guru ── */}
          <div className="bg-white rounded-[24px] border border-mist/60 shadow-sm lg:flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center gap-2 p-5 pb-3 shrink-0">
              {/* ✅ chip navy solid + icon putih */}
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-navy/60 leading-none">Catatan</p>
                <p className="text-sm font-bold text-navy leading-tight mt-0.5">Catatan Guru</p>
              </div>
            </div>
            <div className="lg:flex-1 px-5 pb-5 lg:min-h-0">
              <div className="w-full min-h-[120px] max-h-56 lg:max-h-none lg:h-full overflow-y-auto custom-scrollbar text-[13px] font-medium text-navy/70 whitespace-pre-line leading-relaxed bg-mist/30 border border-mist/60 rounded-[24px] p-3">
                - Kunjungan ke perusahaan mitra minggu ini
                - Verifikasi laporan PKL anak bimbingan
                - Update rekap kehadiran bulanan
                <span className="block mt-2 text-xs text-navy/40 italic">Catatan dapat diakses dari menu Monitoring.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};