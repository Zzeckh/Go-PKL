import React, { useEffect, useMemo, useState } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { api } from '../utils/api';

/* ══════════════════════════════════════════════════════
   KALENDER KEHADIRAN (shared: Siswa / Guru / Mentor)
   ──────────────────────────────────────────────────────
   - Tidak membuat endpoint baru. Menggunakan GET /api/absensi
     yang otorisasinya SUDAH diatur di backend
     (absensiController.getAllAbsensi):
       • student  -> hanya absensi miliknya sendiri
       • teacher  -> hanya absensi siswa dengan teacherId = dirinya
       • mentor   -> hanya absensi siswa di perusahaan yang mentorId = dirinya
     Sehingga guru/mentor TIDAK BISA melihat siswa di luar
     kewenangannya, karena data di luar itu memang tidak pernah
     dikirim oleh server.
   - Untuk siswa: cukup panggil tanpa prop `userId` (memakai data
     dirinya sendiri, yang memang satu-satunya yang dikembalikan
     server untuk role student).
   - Untuk guru/mentor: berikan prop `userId` (id siswa yang
     dipilih dari daftar siswa bimbingannya) supaya kalender
     memfilter ke siswa tsb.
   ══════════════════════════════════════════════════════ */

interface AttendanceCalendarModalProps {
  userId?: number;
  userName?: string;
  onClose: () => void;
}

type DayStatus = 'hadir' | 'izin' | 'sakit' | 'alpha' | 'libur' | null;

interface RawAbsensi {
  id: number;
  date: string;
  status: string;
  userId?: number;
  user?: { id: number; name: string };
}

interface RawPermission {
  id: number;
  date: string;
  type: string; // 'izin' | 'sakit'
  status: string; // 'pending' | 'approved' | 'rejected'
  userId?: number;
  user?: { id: number; name: string };
}

interface RawLogbook {
  id: number;
  date: string;
  activityTitle: string;
  description: string;
  hours: number;
  category?: string | null;
  status: string; // 'pending' | 'approved' | 'rejected'
  feedback?: string | null;
  userId?: number;
  user?: { id: number; name: string };
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

export const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({
  userId,
  userName,
  onClose,
}) => {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [records, setRecords] = useState<RawAbsensi[]>([]);
  const [permissions, setPermissions] = useState<RawPermission[]>([]);
  const [logbooks, setLogbooks] = useState<RawLogbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Tiga endpoint yang sudah ada; otorisasi role sudah ditangani backend
        // (guru/mentor hanya menerima data siswa yang menjadi kewenangannya).
        const [absensiData, permissionData, logbookData] = await Promise.all([
          api.get<RawAbsensi[]>('/api/absensi'),
          api.get<RawPermission[]>('/api/permissions'),
          api.get<RawLogbook[]>('/api/logbook'),
        ]);
        if (!cancelled) {
          setRecords(Array.isArray(absensiData) ? absensiData : []);
          setPermissions(Array.isArray(permissionData) ? permissionData : []);
          setLogbooks(Array.isArray(logbookData) ? logbookData : []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Gagal memuat data kehadiran');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Data absensi milik siswa yang relevan saja (diri sendiri jika siswa,
  // atau siswa terpilih jika guru/mentor).
  const scopedRecords = useMemo(() => {
    if (userId == null) return records;
    return records.filter(r => (r.user?.id ?? r.userId) === userId);
  }, [records, userId]);

  const scopedPermissions = useMemo(() => {
    const approved = permissions.filter(p => p.status === 'approved');
    if (userId == null) return approved;
    return approved.filter(p => (p.user?.id ?? p.userId) === userId);
  }, [permissions, userId]);

  const scopedLogbooks = useMemo(() => {
    if (userId == null) return logbooks;
    return logbooks.filter(l => (l.user?.id ?? l.userId) === userId);
  }, [logbooks, userId]);

  const getLogbooksForDate = (date: Date) =>
    scopedLogbooks.filter(l => sameDay(new Date(l.date), date));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const changeMonth = (delta: number) => {
    setSelectedCell(null);
    setViewDate(new Date(year, month + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setSelectedCell(null);
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) list.push(y);
    return list;
  }, []);

  const getStatusForDate = (date: Date): DayStatus => {
    const absen = scopedRecords.find(r => sameDay(new Date(r.date), date));
    if (absen) {
      return absen.status === 'hadir' ? 'hadir' : 'alpha';
    }
    const permission = scopedPermissions.find(p => sameDay(new Date(p.date), date));
    if (permission) {
      return permission.type === 'sakit' ? 'sakit' : 'izin';
    }
    if (isWeekend(date)) return 'libur';
    return null;
  };

  const statusLabel = (s: DayStatus) => {
    switch (s) {
      case 'hadir': return 'Hadir';
      case 'izin': return 'Izin';
      case 'sakit': return 'Sakit';
      case 'alpha': return 'Alpha';
      case 'libur': return 'Libur';
      default: return '';
    }
  };

  const dotClass = (s: DayStatus) => {
    switch (s) {
      case 'hadir': return 'bg-emerald-500';
      case 'izin':
      case 'sakit':
      case 'alpha': return 'bg-red-500';
      case 'libur': return 'bg-black dark:bg-white';
      default: return '';
    }
  };

  const textClass = (s: DayStatus) => {
    switch (s) {
      case 'hadir': return 'text-emerald-600';
      case 'izin':
      case 'sakit':
      case 'alpha': return 'text-red-600';
      case 'libur': return 'text-navy/60';
      default: return '';
    }
  };

  // Bangun grid kalender (Senin-Minggu), termasuk sel kosong dari bulan
  // sebelum/sesudah agar layout grid tetap rapi seperti kalender pada umumnya.
  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0 = Senin
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list: { date: Date | null; inMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) list.push({ date: null, inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) list.push({ date: new Date(year, month, d), inMonth: true });
    while (list.length % 7 !== 0) list.push({ date: null, inMonth: false });
    return list;
  }, [year, month]);

  const today = new Date();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-navy/50 backdrop-blur-md">
      <div className="bg-white rounded-t-[24px] sm:rounded-[24px] max-w-lg w-full shadow-2xl border border-mist/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Header ── */}
        <div className="p-4 sm:p-5 border-b border-mist/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[10px] bg-navy text-white flex items-center justify-center shrink-0 shadow-md shadow-navy/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-navy leading-tight truncate">
                Kalender Kehadiran
              </h3>
              <p className="text-[11px] font-semibold text-navy/50 truncate">
                {userName ? userName : 'Riwayat kehadiran Anda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] bg-mist/60 hover:bg-mist flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 text-navy/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
          {/* ── Pemilih bulan ── */}
          <div className="flex items-center justify-between gap-2 bg-mist/30 border border-mist/60 rounded-2xl p-2">
            <button
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 rounded-lg bg-white border border-mist/60 flex items-center justify-center hover:bg-mist/40 transition-colors shrink-0"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-navy" />
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <select
                value={month}
                onChange={e => { setSelectedCell(null); setViewDate(new Date(year, Number(e.target.value), 1)); }}
                className="bg-white border border-mist/60 rounded-lg text-xs sm:text-sm font-bold text-navy px-2 py-1.5 outline-none focus:border-steel"
              >
                {BULAN.map((b, i) => (
                  <option key={b} value={i}>{b}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={e => { setSelectedCell(null); setViewDate(new Date(Number(e.target.value), month, 1)); }}
                className="bg-white border border-mist/60 rounded-lg text-xs sm:text-sm font-bold text-navy px-2 py-1.5 outline-none focus:border-steel"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => changeMonth(1)}
              className="w-8 h-8 rounded-lg bg-white border border-mist/60 flex items-center justify-center hover:bg-mist/40 transition-colors shrink-0"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4 text-navy" />
            </button>
          </div>

          <div className="flex items-center justify-between -mt-2">
            <p className="text-[11px] text-navy/40 font-medium">Klik tanggal untuk melihat detail & logbook</p>
            <button
              onClick={goToday}
              className="text-[11px] font-bold text-steel hover:underline shrink-0"
            >
              Kembali ke bulan ini
            </button>
          </div>

          {/* ── Isi kalender ── */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-6 h-6 text-navy/40 animate-spin mb-2" />
              <p className="text-xs font-semibold text-navy/50">Memuat data kehadiran...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <AlertTriangle className="w-8 h-8 text-navy/30 mb-2" />
              <p className="text-sm font-bold text-navy mb-1">Gagal memuat data</p>
              <p className="text-xs text-navy/50">{error}</p>
            </div>
          ) : (
            <>
              {/* Header hari */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {HARI.map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase text-navy/40 py-1">
                    {h}
                  </span>
                ))}
              </div>

              {/* Grid tanggal */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, idx) => {
                  if (!cell.date) {
                    return <div key={idx} className="aspect-square" />;
                  }
                  const status = getStatusForDate(cell.date);
                  const isToday = sameDay(cell.date, today);
                  const cellKey = cell.date.toISOString();
                  const isSelected = selectedCell === cellKey;
                  const hasLogbook = getLogbooksForDate(cell.date).length > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 p-0.5 transition-all relative ${
                        isToday ? 'border-steel bg-steel/5' : 'border-mist/50 bg-white'
                      } ${isSelected ? 'ring-2 ring-steel/50' : ''} hover:border-steel/40`}
                    >
                      {hasLogbook && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-steel" />
                      )}
                      <span className={`text-[11px] sm:text-xs font-bold ${isToday ? 'text-steel' : 'text-navy'}`}>
                        {cell.date.getDate()}
                      </span>
                      {status && <span className={`w-1.5 h-1.5 rounded-full ${dotClass(status)}`} />}
                      {(status === 'izin' || status === 'sakit') && (
                        <span className={`text-[8px] sm:text-[9px] font-bold leading-none ${textClass(status)}`}>
                          {statusLabel(status)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Detail tanggal terpilih */}
              {selectedCell && (() => {
                const date = new Date(selectedCell);
                const status = getStatusForDate(date);
                const dayLogbooks = getLogbooksForDate(date);
                return (
                  <div className="bg-mist/30 border border-mist/60 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">
                        {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        status === 'hadir'
                          ? 'bg-emerald-500 text-white'
                          : status === 'izin' || status === 'sakit' || status === 'alpha'
                            ? 'bg-red-500 text-white'
                            : status === 'libur'
                              ? 'bg-black text-white'
                              : 'bg-white text-navy/50 border border-mist/60'
                      }`}>
                        {status ? statusLabel(status) : 'Tidak ada data'}
                      </span>
                    </div>

                    {/* ── Isi logbook pada tanggal ini ── */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Logbook
                      </p>
                      {dayLogbooks.length === 0 ? (
                        <p className="text-xs text-navy/50 bg-white border border-mist/60 rounded-xl p-2.5">
                          Belum ada logbook pada tanggal ini.
                        </p>
                      ) : (
                        dayLogbooks.map(l => (
                          <div key={l.id} className="bg-white border border-mist/60 rounded-xl p-2.5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-bold text-navy truncate">{l.activityTitle}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                l.status === 'approved'
                                  ? 'bg-steel text-white'
                                  : l.status === 'rejected'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-mist text-navy/60'
                              }`}>
                                {l.status === 'approved' ? 'Disetujui' : l.status === 'rejected' ? 'Revisi' : 'Menunggu'}
                              </span>
                            </div>
                            <p className="text-[11px] text-navy/60 leading-relaxed">{l.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {l.category && (
                                <span className="text-[10px] font-semibold text-navy/40">{l.category}</span>
                              )}
                              <span className="text-[10px] font-semibold text-navy/40">{l.hours} jam</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Legenda ── */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-mist/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-navy/60">Hadir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[11px] font-semibold text-navy/60">Izin / Sakit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black" />
                  <span className="text-[11px] font-semibold text-navy/60">Libur</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-steel" />
                  <span className="text-[11px] font-semibold text-navy/60">Ada Logbook</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
