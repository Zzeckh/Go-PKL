import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Activity, GraduationCap, Calendar, AlertCircle, X, Building, Clock } from 'lucide-react';
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
    <div className="h-full w-full flex flex-col gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
      {/* ── HEADER ── */}
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
          placeholder="Cari nama atau perusahaan..."
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

      {/* ── LIST SISWA ── */}
      <div className="lg:flex-1 bg-white rounded-[24px] border border-mist/60 shadow-sm overflow-hidden flex flex-col lg:min-h-0">
        <div className="lg:flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 max-h-[65vh] lg:max-h-none">
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
                const pct = s.kehadiran || 0;

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="w-full p-4 rounded-[24px] border border-mist/60 bg-white flex items-center gap-4 hover:border-steel/30 hover:shadow-sm transition-all text-left group"
                  >
                    {/* ✅ avatar kotak navy */}
                    <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-navy/20">
                      {getInitials(s.name)}
                    </div>

                    {/* ── info utama ── */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-navy truncate">{s.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
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

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-navy/50 truncate">
                          {s.kelas || '-'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-navy/20 shrink-0" />
                        <span className="text-[11px] font-semibold text-navy/50 truncate">
                          {s.perusahaan || '-'}
                        </span>
                      </div>

                      {/* ── progress bar kehadiran ── */}
                      <div className="flex items-center gap-2.5 mt-2.5">
                        <div className="flex-1 h-1.5 bg-mist/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-navy/50 tabular-nums w-8 text-right">{pct}%</span>
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
        <TeacherKehadiranDetailModal
          student={selectedStudent}
          attendances={attendances}
          perizinanList={perizinanList}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL DETAIL KEHADIRAN SISWA
   ✅ riwayat difilter per siswa, badge solid
   ══════════════════════════════════════════════════════ */
const TeacherKehadiranDetailModal: React.FC<{
  student: any;
  attendances: any[];
  perizinanList: any[];
  onClose: () => void;
}> = ({ student, attendances, perizinanList, onClose }) => {
  const studentAttendances = attendances.filter(a => a.userId === student.id);
  const hadirCount = studentAttendances.filter(a => a.status === 'Hadir').length;
  const izinCount = perizinanList.filter(p => p.userId === student.id && p.status === 'approved').length;
  const pct = student.kehadiran || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-md w-full shadow-2xl border border-mist/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Header ── */}
        <div className="p-4 sm:p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center font-bold text-sm shadow-md shadow-navy/20">
              {getInitials(student.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-navy leading-tight truncate">{student.name}</h3>
              <p className="text-[11px] font-semibold text-navy/50">{student.kelas || '-'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
          {/* ── Tempat Magang ── */}
          <div className="flex items-center gap-3 bg-mist/30 border border-mist/60 rounded-2xl p-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <Building className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase text-navy/50">Tempat Magang</p>
              <p className="text-sm font-bold text-navy truncate">{student.perusahaan || '-'}</p>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-mist/60 shadow-sm rounded-2xl p-3 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center mb-1.5">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-navy tabular-nums leading-none">{hadirCount}</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Hadir</p>
            </div>
            <div className="bg-white border border-mist/60 shadow-sm rounded-2xl p-3 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center mb-1.5">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-navy tabular-nums leading-none">{izinCount}</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Izin</p>
            </div>
            <div className="bg-white border border-mist/60 shadow-sm rounded-2xl p-3 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center mb-1.5">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-navy tabular-nums leading-none">{pct}%</p>
              <p className="text-[9px] font-bold text-navy/50 uppercase tracking-wide mt-1">Persentase</p>
            </div>
          </div>

          {/* ── Progress visual ── */}
          <div className="bg-mist/30 border border-mist/60 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase text-navy/50">Tingkat Kehadiran</p>
              <span className="text-[11px] font-bold text-navy tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 bg-mist/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>

          {/* ── Riwayat Absensi ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Riwayat Absensi Terakhir
            </p>
            {studentAttendances.length === 0 ? (
              <p className="text-xs text-navy/50 bg-mist/30 border border-mist/60 rounded-2xl p-3">Belum ada data absensi.</p>
            ) : (
              <div className="space-y-1.5">
                {studentAttendances.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-mist/30 border border-mist/60">
                    <span className="text-xs font-bold text-navy">{a.date}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
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