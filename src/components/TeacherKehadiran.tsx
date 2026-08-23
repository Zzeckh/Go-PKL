import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Activity, GraduationCap, Calendar, AlertCircle, X, Building } from 'lucide-react';
import { useApp } from '../context/AppContext';

const getInitials = (name: string) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ══════════════════════════════════════════════════════
   TEACHER KEHADIRAN
   ══════════════════════════════════════════════════════ */
export const TeacherKehadiran: React.FC = () => {
  const { siswaList, attendances, perizinanList } = useApp();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  const filtered = useMemo(
    () => siswaList.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.perusahaan || '').toLowerCase().includes(search.toLowerCase())
    ),
    [siswaList, search]
  );

  const presentToday = siswaList.filter(s => (s.kehadiran || 0) >= 75).length;

  const stats = [
    { icon: GraduationCap, label: 'Total Siswa', value: siswaList.length },
    { icon: Activity, label: 'Rekap Kehadiran', value: `${siswaList.length ? Math.round(siswaList.reduce((a, s) => a + (s.kehadiran || 0), 0) / siswaList.length) : 0}%` },
    { icon: Calendar, label: 'Hadir Hari Ini (est.)', value: `${presentToday}/${siswaList.length}` },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white rounded-[24px] p-4 md:p-5 border border-mist/60 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 bg-navy rounded-[10px] flex items-center justify-center text-white shadow-md shadow-navy/20 shrink-0">
            <Activity className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg md:text-xl text-navy leading-tight truncate">Kehadiran Siswa Magang</h2>
            <p className="text-[13px] text-navy/60 font-semibold mt-0.5 truncate">
              {todayLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-mist/60 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-navy flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-navy tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau perusahaan..."
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

      <div className="flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-[10px] bg-navy flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">Tidak ada siswa ditemukan</p>
              <p className="text-xs text-navy/50">Tidak ada siswa yang cocok dengan pencarian ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s => {
                const hadirCount = attendances.filter(a => a.userId === s.id && a.status === 'Hadir').length;
                const izinCount = perizinanList.filter(p => p.userId === s.id && p.status === 'approved').length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="w-full p-3 rounded-[24px] border border-mist/60 bg-white flex items-center gap-3 hover:border-steel/30 transition-all text-left group"
                  >
                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-navy truncate">{s.name}</p>
                      <p className="text-[11px] font-semibold text-navy/50 truncate mt-0.5">
                        {s.kelas || '-'} · {s.perusahaan || '-'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-steel text-white shadow-sm shadow-steel/30 tabular-nums">
                          Hadir {hadirCount}
                        </span>
                        {izinCount > 0 && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white text-navy/70 border border-mist/60 shadow-sm tabular-nums">
                            Izin {izinCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-steel group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <TeacherKehadiranDetailModal student={selectedStudent} attendances={attendances} perizinanList={perizinanList} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
};

const TeacherKehadiranDetailModal: React.FC<{
  student: any;
  attendances: any[];
  perizinanList: any[];
  onClose: () => void;
}> = ({ student, attendances, perizinanList, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 overflow-hidden">
        <div className="p-5 border-b border-mist/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm">
              {getInitials(student.name)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy leading-tight">{student.name}</h3>
              <p className="text-[11px] font-semibold text-navy/50">{student.kelas || '-'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 bg-mist/30 border border-mist/60 rounded-[24px] p-3">
            <Building className="w-4 h-4 text-navy/50 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-navy/50">Tempat Magang</p>
              <p className="text-sm font-bold text-navy truncate">{student.perusahaan || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Hadir</p>
                <p className="text-sm font-bold text-navy">{attendances.filter(a => a.userId === student.id && a.status === 'Hadir').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-mist/60 shadow-sm rounded-2xl p-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-navy/50">Izin / Sakit</p>
                <p className="text-sm font-bold text-navy">{perizinanList.filter(p => p.userId === student.id && p.status === 'approved').length}</p>
              </div>
            </div>
          </div>
          <div className="w-full overflow-y-auto custom-scrollbar text-[13px] font-medium text-navy/70 leading-relaxed bg-mist/30 border border-mist/60 rounded-[24px] p-3 max-h-40">
            <p className="text-[10px] font-bold uppercase text-navy/50 mb-2">Riwayat Absensi Terakhir</p>
            {attendances.length === 0 ? (
              <p className="text-xs text-navy/50">Belum ada data absensi.</p>
            ) : (
              <ul className="space-y-1">
                {attendances.slice(0, 5).map((a, i) => (
                  <li key={i} className="text-xs text-navy/70">• {a.date} — {a.status}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
