import React, { useState } from 'react';
import { Users, Building, FileCheck, ChevronRight, Activity, Calendar } from 'lucide-react';

interface TeacherDashboardProps {
  userName: string;
  schoolName: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ userName, schoolName }) => {
  const [date] = useState(new Date());

  const companies = [
    { id: 1, name: 'PT Tokopedia', mentor: 'Siti Rahma, S.T.', students: 8, attendance: 95 },
    { id: 2, name: 'Gojek Indonesia', mentor: 'Ahmad Yasin, M.Kom.', students: 4, attendance: 92 },
    { id: 3, name: 'Traveloka', mentor: 'Budi Hartono, S.Kom.', students: 3, attendance: 98 },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-4">
      {/* ── Header & Quick Summary ── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-black/50">
            {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-black leading-tight mt-1">Selamat Datang, Guru Pembimbing {userName.split(',')[0]}</h1>
          <div className="flex items-center gap-1.5 mt-2 bg-black/5 w-max px-2.5 py-1 rounded-full border border-black/10">
            <Building className="w-3.5 h-3.5 text-black/60" />
            <span className="text-[11px] font-bold text-black/80">{schoolName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-black/20 transition-all duration-300 cursor-pointer">
          <Users className="w-6 h-6 text-black/40 mb-3" />
          <p className="text-3xl font-bold text-black">15</p>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Total Anak Bimbingan</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white p-5 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-black/20 transition-all duration-300 cursor-pointer">
          <Building className="w-6 h-6 text-black/40 mb-3" />
          <p className="text-3xl font-bold text-black">5</p>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Perusahaan Terdaftar</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-black/10 p-5 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-black/20 transition-all duration-300 cursor-pointer">
          <Activity className="w-6 h-6 text-black/80 mb-3" />
          <p className="text-3xl font-bold text-black">94%</p>
          <p className="text-xs font-bold text-black/70 mt-1 uppercase tracking-wide">Tingkat Kehadiran</p>
        </div>
        <div className="bg-black/5 backdrop-blur-xl rounded-[24px] border border-black/10 p-5 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-black/20 transition-all duration-300 cursor-pointer">
          <FileCheck className="w-6 h-6 text-black/60 mb-3" />
          <p className="text-3xl font-bold text-black">2</p>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">Laporan Verifikasi</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 animate-in fade-in duration-300 flex-1 min-h-0">
        
        {/* Catatan Guru (Kiri) */}
        <div className="hidden lg:flex flex-col w-[300px] shrink-0 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white shadow-sm h-full hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between p-5 pb-3 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/60">Catatan</p>
              <p className="text-sm font-bold text-black">Catatan Guru</p>
            </div>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow-sm bg-white text-black/60 border-black/10 hover:border-black/30 hover:text-black">
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 mx-4 mb-4 bg-white/80 rounded-[20px] border border-black/5 overflow-hidden shadow-inner p-4 text-sm font-medium text-black/80 whitespace-pre-line leading-relaxed">
            - Kunjungan ke Tokopedia (Jumat 10.00)
            - Verifikasi laporan Riko Wijaya
            - Update rekap absensi bulanan
          </div>
        </div>

        {/* Rekapitulasi Batch & Distribusi */}
        <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-5 border-b border-black/5 shrink-0">
            <h3 className="font-bold text-black text-lg">Rekapitulasi Batch & Distribusi Siswa</h3>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Pantau distribusi siswa di setiap DUDI (Dunia Usaha Dunia Industri)</p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {companies.map(company => (
              <div key={company.id} className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 group cursor-pointer hover:border-black/20 transition-all">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-[16px] bg-black/5 flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6 text-black/60" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-black">{company.name}</h4>
                    <p className="text-xs font-semibold text-black/50 mt-0.5">Mentor: {company.mentor}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 border-t sm:border-t-0 border-black/5 pt-4 sm:pt-0">
                  <div className="flex flex-col items-start sm:items-center">
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Siswa Aktif</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-black/60" />
                      <span className="text-sm font-bold text-black">{company.students}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-center">
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">Kehadiran</span>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-black/60" />
                      <span className="text-sm font-bold text-black">{company.attendance}%</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-center">
                    <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 group-hover:bg-black group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
