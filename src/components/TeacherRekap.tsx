import React from 'react';
import { DownloadCloud, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

/* ══════════════════════════════════════════════════════
   TEACHER REKAP
   ══════════════════════════════════════════════════════ */
export const TeacherRekap: React.FC = () => {
  const { siswaList } = useApp();

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
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

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 md:p-5">
          {siswaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Belum ada data rekap</p>
              <p className="text-xs text-navy/50">Belum ada siswa untuk direkap.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-mist">
                  <th className="pb-4 text-[10px] font-bold text-navy/40 uppercase tracking-widest">Siswa</th>
                  <th className="pb-4 text-[10px] font-bold text-navy/40 uppercase tracking-widest">DUDI</th>
                  <th className="pb-4 text-[10px] font-bold text-navy/40 uppercase tracking-widest">Nilai Industri</th>
                  <th className="pb-4 text-[10px] font-bold text-navy/40 uppercase tracking-widest">Nilai Sekolah</th>
                  <th className="pb-4 text-[10px] font-bold text-navy/40 uppercase tracking-widest text-center">Nilai Akhir</th>
                  <th className="pb-4 text-[10px] font-bold text-navy/40 uppercase tracking-widest">Kelengkapan Berkas</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa) => (
                  <tr key={siswa.id} className="border-b border-mist/40 transition-colors hover:bg-mist/30">
                    <td className="py-4 font-bold text-sm text-navy">{siswa.name}</td>
                    <td className="py-4 text-xs font-semibold text-navy/60">{siswa.perusahaan}</td>
                    <td className="py-4 text-sm font-bold text-navy">{siswa.nilaiDUDI}</td>
                    <td className="py-4 text-sm font-bold text-navy">{siswa.nilaiGuru}</td>
                    <td className="py-4 text-center">
                      <span className="text-sm font-black bg-steel text-white shadow-sm shadow-steel/30 px-4 py-1.5 rounded-[24px] inline-block">
                        {siswa.finalNilai}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-mist/60 rounded-full overflow-hidden">
                          <div className="h-full bg-steel rounded-full" style={{ width: `${siswa.berkasPct}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-navy w-10">{siswa.berkasPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
