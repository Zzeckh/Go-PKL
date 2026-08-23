import React, { useState } from 'react';
import {
  Search, CheckCircle2,
  Users, Clock, Activity, ChevronRight, BookOpen, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   TEACHER MONITORING
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
    if (status === 'approved') return 'bg-steel text-white shadow-sm shadow-steel/30';
    if (status === 'revision') return 'bg-navy text-white';
    return 'bg-white text-navy/70 border border-mist/60 shadow-sm';
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
        <div className="bg-mist/40 p-1 rounded-[24px] flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterCompany('all')}
            className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterCompany === 'all' ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'
            }`}
          >
            Semua Perusahaan
          </button>
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setFilterCompany(c)}
              className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterCompany === c ? 'bg-steel text-white shadow' : 'text-navy/60 hover:text-navy'
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
                      <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-white" />
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
                    <tr key={siswa.id} onClick={() => setSelectedSiswa(siswa)} className="border-b border-mist/40 transition-colors hover:bg-mist/30 cursor-pointer group/tr">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-steel text-white shadow-sm shadow-steel/30 tabular-nums">
                            Hadir {hadirCount}
                          </span>
                          {izinCount > 0 && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white text-navy/70 border border-mist/60 shadow-sm tabular-nums">
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
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-white text-navy/70 border border-mist/60 shadow-sm px-2.5 py-1 rounded-full w-max">
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
        <div className="shrink-0 text-[11px] font-semibold text-navy/40 px-4 py-2.5 border-t border-mist/60 bg-mist/40">
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

/* ══════════════════════════════════════════════════════
   MODAL DETAIL SISWA
   ✅ Logbook TIDAK ditampilkan di card detail —
      modal fokus ke statistik + riwayat kehadiran siswa
   ══════════════════════════════════════════════════════ */
const MonitoringDetailModal: React.FC<{
  siswa: any;
  logs: any[];
  attendances: any[];
  perizinanList: any[];
  onClose: () => void;
}> = ({ siswa, logs, attendances, perizinanList, onClose }) => {
  const siswaLogs = logs.filter(l => l.userId === siswa.id);
  /* ✅ riwayat kehadiran difilter per siswa */
  const siswaAttendances = attendances.filter(a => a.userId === siswa.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-[24px] max-w-lg w-full shadow-2xl border border-mist/60 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm">
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
          {/* ── Stats ringkas ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Hadir</p>
                <p className="text-sm font-bold text-navy">{siswaAttendances.filter(a => a.status === 'Hadir').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Izin / Sakit</p>
                <p className="text-sm font-bold text-navy">{perizinanList.filter(p => p.userId === siswa.id && p.status === 'approved').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Total Logbook</p>
                <p className="text-sm font-bold text-navy">{siswaLogs.length}</p>
              </div>
            </div>
          </div>

          {/* ── Riwayat Kehadiran (hanya milik siswa ini) ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Riwayat Kehadiran
            </p>
            {siswaAttendances.length === 0 ? (
              <p className="text-xs text-navy/50 bg-mist/30 border border-mist/60 rounded-[24px] p-3">Belum ada data absensi.</p>
            ) : (
              <div className="space-y-1.5">
                {siswaAttendances.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-[24px] bg-mist/30 border border-mist/60">
                    <span className="text-xs font-bold text-navy">{a.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === 'Hadir'
                        ? 'bg-steel text-white shadow-sm shadow-steel/30'
                        : 'bg-white text-navy/70 border border-mist/60 shadow-sm'
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