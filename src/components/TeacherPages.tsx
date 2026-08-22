import React, { useState } from 'react';
import {
  Search, CheckCircle2,
  FileText, DownloadCloud, Check, X, Users, Clock, AlertCircle, Activity, ChevronRight, BookOpen, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { assetUrl } from '../utils/api';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   TEACHER & MENTOR MONITORING
   ══════════════════════════════════════════════════════ */
export const TeacherMonitoring: React.FC = () => {
  const { siswaList, logEntries, attendances, perizinanList } = useApp();
  const [filterCompany, setFilterCompany] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  const companies = Array.from(new Set(siswaList.map(s => s.perusahaan).filter(c => c && c !== '-')));

  const filteredSiswa = siswaList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.perusahaan.toLowerCase().includes(search.toLowerCase());
    const matchesComp = filterCompany === 'all' || s.perusahaan === filterCompany;
    return matchesSearch && matchesComp;
  });

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-steel/15 text-steel';
    if (status === 'revision') return 'bg-navy/10 text-navy';
    return 'bg-steel/10 text-steel';
  };
  const statusLabel = (status: string) =>
    status === 'approved' ? 'Disetujui' : status === 'revision' ? 'Revisi' : 'Menunggu';

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">

      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Monitoring Logbook & Kehadiran</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Pantau aktivitas harian seluruh anak bimbingan
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-3">
        <div className="bg-shell p-1 rounded-[24px] flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterCompany('all')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterCompany === 'all' ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
            }`}
          >
            Semua Perusahaan
          </button>
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setFilterCompany(c)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterCompany === c ? 'bg-white text-navy shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama siswa atau perusahaan..."
            className="w-full bg-white border border-mist/60 rounded-[24px] pl-10 pr-10 py-2.5 text-sm font-medium text-navy outline-none focus:border-steel transition-all"
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

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-mist/60">
                <th className="p-4 text-[11px] font-bold text-navy/50 uppercase tracking-widest">Siswa</th>
                <th className="p-4 text-[11px] font-bold text-navy/50 uppercase tracking-widest">Perusahaan</th>
                <th className="p-4 text-[11px] font-bold text-navy/50 uppercase tracking-widest">Kehadiran</th>
                <th className="p-4 text-[11px] font-bold text-navy/50 uppercase tracking-widest">Logbook Terbaru</th>
                <th className="p-4 text-[11px] font-bold text-navy/50 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-[10px] bg-shell flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-navy/30" />
                      </div>
                      <p className="text-sm font-bold text-navy mb-1">Siswa tidak ditemukan</p>
                      <p className="text-xs text-navy/50">Tidak ada siswa yang cocok dengan pencarian ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa) => {
                  const siswaLogs = logEntries
                    .filter(l => l.userId === siswa.id)
                    .slice(0, 1);
                  const latestLog = siswaLogs[0];
                  const hadirCount = attendances.filter(a => a.userId === siswa.id && a.status === 'Hadir').length;
                  const izinCount = perizinanList.filter(p => p.userId === siswa.id && p.status === 'approved').length;
                  return (
                    <tr key={siswa.id} onClick={() => setSelectedSiswa(siswa)} className="border-b border-mist/40 transition-colors hover:bg-shell/60 cursor-pointer group/tr">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(siswa.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-navy">{siswa.name}</p>
                            <p className="text-[11px] font-semibold text-navy/50">{siswa.kelas}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-navy/60">{siswa.perusahaan}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-steel/15 text-steel tabular-nums">
                            Hadir {hadirCount}
                          </span>
                          {izinCount > 0 && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#9CA3AF]/20 text-[#6B7280] tabular-nums">
                              Izin {izinCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-navy/80">
                        {latestLog ? latestLog.title : `${siswa.logs} logbook`}
                      </td>
                      <td className="p-4">
                        {latestLog ? (
                          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full w-max ${statusColor(latestLog.status)}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> {statusLabel(latestLog.status)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-steel/10 text-steel px-2.5 py-1 rounded-full w-max">
                            <Clock className="w-3.5 h-3.5" /> Belum ada log
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 text-[11px] font-semibold text-navy/40 px-4 py-2.5 border-t border-mist/60 bg-shell/40">
          <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> Klik baris siswa untuk melihat detail logbook & kehadiran</span>
        </div>
      </div>

      {selectedSiswa && (
        <MonitoringDetailModal
          siswa={selectedSiswa}
          logs={logEntries}
          attendances={attendances}
          perizinanList={perizinanList}
          onClose={() => setSelectedSiswa(null)}
        />
      )}
    </div>
  );
};

const MonitoringDetailModal: React.FC<{
  siswa: any;
  logs: any[];
  attendances: any[];
  perizinanList: any[];
  onClose: () => void;
}> = ({ siswa, logs, attendances, perizinanList, onClose }) => {
  const siswaLogs = logs.filter(l => l.userId === siswa.id);

  const statusLabel = (s: string) =>
    s === 'approved' ? 'Disetujui' : s === 'revision' ? 'Revisi' : 'Menunggu';
  const statusPill = (s: string) =>
    s === 'approved' ? 'bg-steel/15 text-steel'
    : s === 'revision' ? 'bg-navy/10 text-navy'
    : 'bg-steel/10 text-steel';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-[24px] max-w-lg w-full shadow-2xl border border-mist/60 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
              {getInitials(siswa.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-navy leading-tight truncate">{siswa.name}</h3>
              <p className="text-[11px] font-semibold text-navy/50">{siswa.kelas} · {siswa.perusahaan || '-'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-3 bg-shell border border-mist rounded-[24px] p-3">
              <Activity className="w-4 h-4 text-steel shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Hadir</p>
                <p className="text-sm font-bold text-steel">{attendances.filter(a => a.userId === siswa.id && a.status === 'Hadir').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-shell border border-mist rounded-[24px] p-3">
              <Activity className="w-4 h-4 text-[#6B7280] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Izin / Sakit</p>
                <p className="text-sm font-bold text-[#6B7280]">{perizinanList.filter(p => p.userId === siswa.id && p.status === 'approved').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-shell border border-mist rounded-[24px] p-3">
              <BookOpen className="w-4 h-4 text-steel shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Total Logbook</p>
                <p className="text-sm font-bold text-navy">{siswaLogs.length}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Logbook
            </p>
            {siswaLogs.length === 0 ? (
              <p className="text-xs text-navy/50 bg-shell/60 border border-mist/60 rounded-[24px] p-3">Belum ada logbook.</p>
            ) : (
              <div className="space-y-2">
                {siswaLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-[24px] border border-mist/60 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-navy flex-1 min-w-0">{log.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusPill(log.status)}`}>
                        {statusLabel(log.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {log.userName && (
                        <span className="text-[10px] font-bold text-navy/70 bg-navy/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User className="w-3 h-3" />{log.userName}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-navy/50">
                        {log.date} · {log.hours} jam
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-[11px] font-medium text-navy/70 mt-1.5 leading-relaxed">{log.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Riwayat Kehadiran
            </p>
            {attendances.length === 0 ? (
              <p className="text-xs text-navy/50 bg-shell/60 border border-mist/60 rounded-[24px] p-3">Belum ada data absensi.</p>
            ) : (
              <div className="space-y-1.5">
                {attendances.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-[24px] bg-shell/60 border border-mist/60">
                    <span className="text-xs font-bold text-navy">{a.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === 'Hadir' ? 'bg-steel/15 text-steel' : 'bg-steel/10 text-steel'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   TEACHER & MENTOR PERIZINAN
   ══════════════════════════════════════════════════════ */
export const TeacherPerizinan: React.FC = () => {
  const { perizinanList, updatePerizinanStatus } = useApp();

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight">Verifikasi Perizinan & Surat Sakit</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              Tinjau dan setujui pengajuan izin absen siswa
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
          {perizinanList.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-shell flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-steel" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Tidak ada pengajuan perizinan</p>
              <p className="text-xs text-navy/50">Semua izin telah diproses.</p>
            </div>
          ) : (
            perizinanList.map(req => (
              <div key={req.id} className="bg-white rounded-[24px] p-5 border border-mist/60 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4 border-b border-mist/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(req.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-navy">{req.name}</h4>
                      <p className="text-[11px] font-semibold text-navy/50">{req.company} • {req.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    req.type === 'Sakit' ? 'bg-navy/10 text-navy' : 'bg-steel/10 text-steel'
                  }`}>
                    {req.type}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-1">Alasan</p>
                  <p className="text-xs font-semibold text-navy/80 leading-relaxed">{req.reason}</p>
                </div>

                <div className="flex items-center gap-2 bg-shell p-3 rounded-[24px] border border-mist/60">
                  <FileText className="w-4 h-4 text-navy/50 shrink-0" />
                  {req.attachment ? (
                    <>
                      <span className="text-xs font-bold text-navy truncate flex-1">Surat keterangan terlampir</span>
                      <a
                        href={assetUrl(req.attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-steel text-white rounded-lg text-[11px] font-bold hover:bg-steel/90 transition-colors shrink-0"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" /> Lihat Gambar
                      </a>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-navy/50 truncate flex-1">Tidak ada lampiran</span>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => updatePerizinanStatus(req.id, 'rejected')}
                        className="flex-1 py-3 bg-navy/5 border border-navy/15 text-navy rounded-[24px] text-xs font-bold flex items-center justify-center gap-2 hover:bg-navy/10 transition-colors"
                      >
                        <X className="w-4 h-4" /> Tolak Izin
                      </button>
                      <button
                        onClick={() => updatePerizinanStatus(req.id, 'approved')}
                        className="flex-1 py-3 bg-steel text-white rounded-[24px] text-xs font-bold shadow-md shadow-steel/25 flex items-center justify-center gap-2 hover:bg-steel/90 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Setujui Izin
                      </button>
                    </>
                  ) : (
                    <div className={`w-full py-2 rounded-[24px] text-center border ${
                      req.status === 'approved' ? 'bg-steel/10 border-steel/20' : 'bg-navy/5 border-navy/15'
                    }`}>
                      <span className={`text-xs font-bold capitalize ${req.status === 'approved' ? 'text-steel' : 'text-navy'}`}>
                        {req.status === 'approved' ? '✓ Disetujui' : '✕ Ditolak'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   TEACHER & MENTOR REKAP
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
              <div className="w-14 h-14 rounded-[10px] bg-shell flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-navy/30" />
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
                  <tr key={siswa.id} className="border-b border-mist/40 transition-colors hover:bg-shell/40">
                    <td className="py-4 font-bold text-sm text-navy">{siswa.name}</td>
                    <td className="py-4 text-xs font-semibold text-navy/60">{siswa.perusahaan}</td>
                    <td className="py-4 text-sm font-bold text-navy">{siswa.nilaiDUDI}</td>
                    <td className="py-4 text-sm font-bold text-navy">{siswa.nilaiGuru}</td>
                    <td className="py-4 text-center">
                      <span className="text-sm font-black bg-steel/10 text-steel px-4 py-1.5 rounded-[24px] inline-block">
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