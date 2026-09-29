import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarX,
  AlertCircle,
  Users,
} from 'lucide-react';

import { api } from '../utils/api';

/* ============================================================
   Rekap Harian — REKANAN dari RekapanHarian di gopkl-student
   (mobile). Endpoint sama: GET /api/absensi?month=YYYY-MM
   yang otomatis mengikuti cakupan role (guru → siswa bimbingan,
   mentor → siswa binaan, hubin/super_admin → seluruh siswa).
============================================================ */

/* ── Helpers bulan (YYYY-MM) ── */
const monthKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const shiftMonth = (key: string, delta: number): string => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1] ?? ''} ${y}`;
};

const thisMonthKey = monthKey(new Date());

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/* ── Baris rekap ── */
interface RecapRow {
  id: number;
  dateKey: string;
  dateLabel: string;
  userId: number;
  userName: string;
  className: string;
  status: string;
  masuk: string | null;
  pulang: string | null;
  jam: string | null;
}

const parseHM = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const fmtTime = (iso: string | null | undefined): string | null => {
  const t = parseHM(iso);
  if (t === null) return null;
  return new Date(t).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
};

const toRow = (a: any): RecapRow => {
  const inT = parseHM(a?.checkInTime);
  const outT = parseHM(a?.checkOutTime ?? null);
  const jam =
    inT !== null && outT !== null && outT > inT
      ? fmtDuration(Math.round((outT - inT) / 60000))
      : null;

  const dateKey = String(a?.date ?? '').slice(0, 10);
  const [, m, d] = dateKey.split('-');

  const status = String(a?.status ?? 'hadir');

  return {
    id: Number(a?.id ?? 0),
    dateKey,
    dateLabel:
      d && m
        ? `${Number(d)} ${MONTH_SHORT[Number(m) - 1] ?? ''}`.trim()
        : dateKey,
    userId: Number(a?.user?.id ?? a?.userId ?? 0),
    userName: a?.user?.name ?? '—',
    className: a?.user?.class?.name ?? '',
    status,
    masuk: status === 'hadir' ? fmtTime(a?.checkInTime) : null,
    pulang: status === 'hadir' ? fmtTime(a?.checkOutTime ?? null) : null,
    jam,
  };
};

const SkeletonRows: React.FC = () => (
  <div className="flex flex-col">
    {[0, 1, 2, 3, 4].map(i => (
      <div key={i} className="flex items-center gap-4 px-2 py-3">
        <div className="h-3 w-16 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3 w-32 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3 w-10 rounded-full bg-mist/70 animate-pulse ml-auto" />
        <div className="h-3 w-10 rounded-full bg-mist/70 animate-pulse" />
        <div className="h-3 w-12 rounded-full bg-mist/70 animate-pulse" />
      </div>
    ))}
  </div>
);

/* Batas baris dirender — data super admin bisa ratusan baris/bulan */
const MAX_ROWS = 200;

export const RekapHarian: React.FC = () => {
  const [month, setMonth] = useState<string>(thisMonthKey);
  const [rows, setRows] = useState<RecapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string>('');

  const load = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/api/absensi?month=${encodeURIComponent(key)}`);
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setRows(list.map(toRow));
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat rekap absensi.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStudentId('');
    load(month);
  }, [month, load]);

  /* Daftar siswa unik dari data bulan ini (untuk filter) */
  const students = useMemo(() => {
    const map = new Map<number, string>();
    rows.forEach(r => {
      if (r.userId && !map.has(r.userId)) map.set(r.userId, r.userName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name, 'id')
    );
  }, [rows]);

  const visible = useMemo(() => {
    const filtered = studentId
      ? rows.filter(r => String(r.userId) === studentId)
      : rows;
    /* Urutan terbaru dahulu — sama dengan versi mobile (API: createdAt desc) */
    return [...filtered].sort(
      (a, b) =>
        b.dateKey.localeCompare(a.dateKey) ||
        a.userName.localeCompare(b.userName, 'id')
    );
  }, [rows, studentId]);

  const shown = visible.slice(0, MAX_ROWS);

  const hadir = visible.filter(r => r.status === 'hadir').length;
  const totalMinutes = visible.reduce((sum, r) => {
    if (!r.jam) return sum;
    const m = r.jam.match(/(\d+)j(?:\s+(\d+)m)?/);
    if (!m) return sum;
    return sum + Number(m[1]) * 60 + Number(m[2] ?? 0);
  }, 0);
  const totalJam = fmtDuration(totalMinutes);

  return (
    <div className="shrink-0 bg-white rounded-[24px] border border-mist/60 shadow-sm p-5">

      {/* ── HEADER + NAVIGASI BULAN + FILTER SISWA ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-navy/50">
            Rekap Harian
          </p>
          <p className="text-[11px] font-semibold text-navy/40 mt-0.5">
            Kehadiran masuk, pulang, dan total jam kerja per tanggal
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {students.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#F1F4F8] border border-mist rounded-full px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-navy/50 shrink-0" />
              <select
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-navy outline-none max-w-[160px]"
              >
                <option value="">Semua siswa</option>
                {students.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-shell border border-mist/60 rounded-full px-1.5 py-1 flex items-center gap-1">
            <button
              onClick={() => setMonth(m => shiftMonth(m, -1))}
              aria-label="Bulan sebelumnya"
              className="w-6 h-6 rounded-full flex items-center justify-center text-navy/60 active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-extrabold text-navy tabular-nums px-1">
              {monthLabel(month)}
            </span>
            <button
              onClick={() => setMonth(m => shiftMonth(m, 1))}
              disabled={month >= thisMonthKey}
              aria-label="Bulan berikutnya"
              className="w-6 h-6 rounded-full flex items-center justify-center text-navy/60 active:scale-90 transition-transform disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {!error && (
        <>
          {/* ── KEPALA TABEL ── */}
          <div className="grid grid-cols-[64px_1fr_64px_64px_72px] gap-x-3 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-navy/50 border-b border-mist/60">
            <span>Tanggal</span>
            <span>Siswa</span>
            <span className="text-right">Masuk</span>
            <span className="text-right">Pulang</span>
            <span className="text-right">Jam</span>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-1.5">
              <CalendarX className="w-7 h-7 text-navy/30" />
              <p className="text-xs font-semibold text-navy/40">
                Belum ada absensi bulan ini
              </p>
            </div>
          ) : (
            <div className="divide-y divide-mist/60">
              {shown.map(r => (
                <div
                  key={r.id}
                  className="grid grid-cols-[64px_1fr_64px_64px_72px] gap-x-3 px-2 py-2.5 items-center"
                >
                  <span className="text-xs font-bold text-navy tabular-nums">
                    {r.dateLabel}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-navy truncate">
                      {r.userName}
                    </span>
                    <span className="block text-[10px] font-semibold text-navy/40 truncate">
                      {r.status !== 'hadir'
                        ? r.status.charAt(0).toUpperCase() + r.status.slice(1)
                        : r.className || '—'}
                    </span>
                  </span>

                  <span className="text-right text-xs font-semibold text-navy tabular-nums">
                    {r.masuk ?? '–'}
                  </span>
                  <span className="text-right text-xs font-semibold text-navy tabular-nums">
                    {r.pulang ?? '–'}
                  </span>
                  <span className="text-right text-xs font-semibold text-navy tabular-nums">
                    {r.jam ?? '–'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loading && visible.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-shell border border-mist/60 rounded-full px-3 py-1.5">
                <span className="text-[11px] font-bold text-navy/70 tabular-nums">
                  {hadir} hari hadir · {totalJam} total
                </span>
              </span>

              {visible.length > MAX_ROWS && (
                <span className="text-[11px] font-semibold text-navy/40">
                  Menampilkan {shown.length} dari {visible.length} baris —
                  gunakan filter siswa untuk mempersempit.
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
