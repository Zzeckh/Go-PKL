import React, { useState, useMemo } from 'react';
import {
  DownloadCloud, AlertCircle, Search, X, GraduationCap, Activity, FileCheck, Building, BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   TEACHER REKAP
   ✅ Card list design + stats row + search
   ══════════════════════════════════════════════════════ */
export const TeacherRekap: React.FC = () => {
  const { siswaList } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => siswaList.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.perusahaan || '').toLowerCase().includes(search.toLowerCase())
    ),
    [siswaList, search]
  );

  const avgFinal = siswaList.length
    ? Math.round(siswaList.reduce((a, s) => a + (parseInt(s.finalNilai) || 0), 0) / siswaList.length)
    : 0;
  const completeBerkas = siswaList.filter(s => (s.berkasPct || 0) >= 100).length;

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: Activity, label: 'Rata-rata Nilai Akhir', value: avgFinal },
    { icon: FileCheck, label: 'Berkas Lengkap', value: `${completeBerkas}/${siswaList.length}` },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      {/* ── HEADER  */}
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <DownloadCloud className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Rekapitulasi Nilai & Laporan</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Penilaian akhir gabungan dan export data sekolah
            </p>
          </div>
        </div>
        <button className="hidden sm:flex items-center gap-1.5 bg-steel text-white text-xs font-bold px-4 py-2 rounded-[24px] shadow-md shadow-steel/25 hover:bg-steel/90 hover:-translate-y-0.5 transition-all shrink-0">
          <DownloadCloud className="w-4 h-4" /> Export Rekap
        </button>
      </div>

      {/* ── STATS — icon chip navy solid + icon putih ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama siswa atau perusahaan..."
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

      {/* ── CARD LIST NILAI ── */}
      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {siswaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Belum ada data rekap</p>
              <p className="text-xs text-navy/50">Belum ada siswa untuk direkap.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Siswa tidak ditemukan</p>
              <p className="text-xs text-navy/50">Tidak ada siswa yang cocok dengan pencarian ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((siswa) => (
                <div
                  key={siswa.id}
                  className="w-full p-4 rounded-[24px] border border-mist/60 bg-white flex flex-col gap-3 hover:border-steel/30 hover:shadow-sm transition-all"
                >
                  {/* ── Row 1: identitas + nilai akhir ── */}
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                      {getInitials(siswa.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-navy truncate">{siswa.name}</p>
                        {/* ✅ nilai akhir: solid steel pill */}
                        <span className="text-xs font-black bg-steel text-white shadow-sm shadow-steel/30 px-3 py-1 rounded-full tabular-nums shrink-0">
                          Akhir {siswa.finalNilai}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-navy/50 truncate">{siswa.kelas || '-'}</span>
                        <span className="w-1 h-1 rounded-full bg-navy/20 shrink-0" />
                        <span className="text-[11px] font-semibold text-navy/50 truncate">{siswa.perusahaan || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Row 2: nilai DUDI + nilai sekolah ── */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
                      <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase text-navy/50">Nilai Industri (DUDI)</p>
                        <p className="text-lg font-bold text-navy tabular-nums leading-tight">{siswa.nilaiDUDI}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
                      <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase text-navy/50">Nilai Sekolah (Guru)</p>
                        <p className="text-lg font-bold text-navy tabular-nums leading-tight">{siswa.nilaiGuru}</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Row 3: kelengkapan berkas ── */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-navy/50 uppercase tracking-wide shrink-0">Berkas</span>
                    <div className="flex-1 h-1.5 bg-mist/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-steel rounded-full transition-all"
                        style={{ width: `${Math.min(siswa.berkasPct || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-navy/50 tabular-nums w-8 text-right">{siswa.berkasPct}%</span>
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