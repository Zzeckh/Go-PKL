const JAKARTA_TZ = 'Asia/Jakarta';

const jakartaParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
};

/**
 * Menormalisasi input tanggal menjadi tengah malam UTC pada tanggal
 * kalender Asia/Jakarta yang bersangkutan.
 *
 * Kenapa harus begini:
 * - Kalau input berupa string "YYYY-MM-DD" (misalnya dari <input type="date">
 *   di form pengajuan izin), angka tahun/bulan/tanggal dibaca apa adanya,
 *   tanpa konversi timezone sama sekali. Ini memang tanggal kalender yang
 *   dipilih user, tidak ambigu.
 * - Kalau input berupa objek Date (misalnya `new Date()` untuk absensi
 *   "hari ini"), tanggal kalendernya dibaca ulang berdasarkan Asia/Jakarta,
 *   BUKAN berdasarkan jam sistem/lokal server. Ini penting supaya siswa yang
 *   check-in dini hari WIB tidak salah dianggap tanggal sebelumnya kalau
 *   server berjalan dengan TZ selain Asia/Jakarta (mis. UTC).
 * - Epoch akhir dibangun dengan Date.UTC(), bukan `new Date(y, m, d)`
 *   (constructor lokal). Ini membuat nilai yang tersimpan konsisten dan
 *   TIDAK bergantung pada environment variable TZ di server tempat proses
 *   Node dijalankan.
 */
export const parseDateOnly = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const { y, m, d } = jakartaParts(value);
    return new Date(Date.UTC(y, m - 1, d));
  }

  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

export const sameDateRange = (value) => {
  const date = parseDateOnly(value);
  if (!date || Number.isNaN(date.getTime())) return null;

  const start = date;
  const end = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return { gte: start, lt: end };
};

// Representasi "YYYY-MM-DD" (berdasarkan tanggal kalender Asia/Jakarta yang
// sudah dinormalisasi) — berguna untuk key perbandingan/grouping tanpa perlu
// bergantung pada timezone browser/server saat memformat ulang.
export const toDateKey = (value) => {
  const date = parseDateOnly(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};