import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle2, 
  FileText, DownloadCloud, Check, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// --- TEACHER & MENTOR MONITORING ---
export const TeacherMonitoring: React.FC = () => {
  const { siswaList, logEntries } = useApp();
  const [filterCompany, setFilterCompany] = useState('all');
  const [search, setSearch] = useState('');

  const filteredSiswa = siswaList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.perusahaan.toLowerCase().includes(search.toLowerCase());
    const matchesComp = filterCompany === 'all' || s.perusahaan.toLowerCase().includes(filterCompany.toLowerCase());
    return matchesSearch && matchesComp;
  });

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-black/5 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-black text-lg">Monitoring Logbook & Kehadiran</h3>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Pemantauan aktivitas harian seluruh anak bimbingan</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black outline-none cursor-pointer"
            >
              <option value="all">Semua Perusahaan</option>
              <option value="tokopedia">PT Tokopedia</option>
              <option value="gojek">Gojek Indonesia</option>
              <option value="traveloka">Traveloka</option>
              <option value="shopee">Shopee Indonesia</option>
            </select>
            <div className="bg-white border border-black/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-black/40" />
              <input 
                type="text" 
                placeholder="Cari siswa..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs w-24 sm:w-32 font-semibold" 
              />
            </div>
            <button className="p-2 border border-black/10 bg-white rounded-xl text-black/60">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-black/5">
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Siswa</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Perusahaan</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Absensi</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Status Logbook</th>
                <th className="p-4 text-xs font-bold text-black/40 uppercase tracking-widest bg-black/[0.02]">Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSiswa.map((siswa) => {
                const latestLog = logEntries[0];
                return (
                  <tr key={siswa.id} className="border-b border-black/5 transition-colors">
                    <td className="p-4 font-bold text-sm text-black">
                      {siswa.name}
                      <p className="text-[10px] font-bold text-black/40 font-normal">{siswa.kelas}</p>
                    </td>
                    <td className="p-4 text-xs font-semibold text-black/60">{siswa.perusahaan}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-black text-white">
                        Hadir ({siswa.kehadiran}%)
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-black/80">{latestLog ? latestLog.title : `${siswa.logs} Logbook`}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold bg-black/5 text-black px-2.5 py-1 rounded-full w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui ({siswa.logs})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- TEACHER & MENTOR PERIZINAN ---
export const TeacherPerizinan: React.FC = () => {
  const { perizinanList, updatePerizinanStatus } = useApp();

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-black/5 shrink-0">
          <h3 className="font-bold text-black text-lg">Verifikasi Perizinan & Surat Sakit</h3>
          <p className="text-xs font-semibold text-black/50 mt-0.5">Tinjau dan setujui pengajuan izin absen siswa</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
          {perizinanList.map(req => (
            <div key={req.id} className="bg-white rounded-[24px] p-5 border border-black/5 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-black/60" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black">{req.name}</h4>
                    <p className="text-[10px] font-bold text-black/50">{req.company} • {req.date}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">
                  {req.type}
                </span>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Alasan</p>
                <p className="text-xs font-semibold text-black/80 leading-relaxed">{req.reason}</p>
              </div>

              <div className="flex items-center gap-2 bg-black/5 p-3 rounded-[16px] border border-black/5">
                <FileText className="w-4 h-4 text-black/50" />
                <span className="text-xs font-bold text-black truncate flex-1">{req.attachment}</span>
                <button className="text-[10px] font-bold bg-white text-black px-3 py-1.5 rounded-lg border border-black/10 shadow-sm">
                  Unduh
                </button>
              </div>

              <div className="flex gap-2 mt-auto pt-2">
                {req.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => updatePerizinanStatus(req.id, 'rejected')}
                      className="flex-1 py-3 bg-white border border-black/20 text-black rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Tolak Izin
                    </button>
                    <button 
                      onClick={() => updatePerizinanStatus(req.id, 'approved')}
                      className="flex-1 py-3 bg-black text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Setujui Izin
                    </button>
                  </>
                ) : (
                  <div className="w-full py-2 bg-black/5 rounded-xl text-center border border-black/5">
                    <span className="text-xs font-bold text-black capitalize">
                      Status: {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- TEACHER & MENTOR REKAP ---
export const TeacherRekap: React.FC = () => {
  const { siswaList } = useApp();

  return (
    <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-sm flex flex-col overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-black/5 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-black text-lg">Rekapitulasi Nilai & Laporan</h3>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Penilaian akhir gabungan dan export data sekolah</p>
          </div>
          <button className="bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md">
            <DownloadCloud className="w-4 h-4" /> Export Rekap PDF
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-5">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-black/10">
                <th className="pb-4 text-[10px] font-bold text-black/40 uppercase tracking-widest">Siswa</th>
                <th className="pb-4 text-[10px] font-bold text-black/40 uppercase tracking-widest">DUDI</th>
                <th className="pb-4 text-[10px] font-bold text-black/40 uppercase tracking-widest">Nilai Industri</th>
                <th className="pb-4 text-[10px] font-bold text-black/40 uppercase tracking-widest">Nilai Sekolah</th>
                <th className="pb-4 text-[10px] font-bold text-black/40 uppercase tracking-widest text-center">Nilai Akhir</th>
                <th className="pb-4 text-[10px] font-bold text-black/40 uppercase tracking-widest">Kelengkapan Berkas</th>
              </tr>
            </thead>
            <tbody>
              {siswaList.map((siswa) => (
                <tr key={siswa.id} className="border-b border-black/5 transition-colors">
                  <td className="py-4 font-bold text-sm text-black">{siswa.name}</td>
                  <td className="py-4 text-xs font-semibold text-black/60">{siswa.perusahaan}</td>
                  <td className="py-4 text-sm font-bold text-black">{siswa.nilaiDUDI}</td>
                  <td className="py-4 text-sm font-bold text-black">{siswa.nilaiGuru}</td>
                  <td className="py-4 text-center">
                    <span className="text-sm font-black bg-black text-white px-4 py-1.5 rounded-2xl inline-block shadow-sm">
                      {siswa.finalNilai}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${siswa.berkasPct}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-black w-10">{siswa.berkasPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
