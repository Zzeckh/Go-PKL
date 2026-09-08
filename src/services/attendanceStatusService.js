import prisma from '../config/db.js';
import { parseDateOnly, sameDateRange } from '../utils/dateOnly.js';

// Status permission yang dianggap masih "mengunci" tanggal terkait untuk
// absensi/izin baru. 'rejected' SENGAJA tidak dimasukkan di sini, karena
// izin yang ditolak tidak boleh dianggap sebagai izin aktif (KONDISI 4).
export const ACTIVE_PERMISSION_STATUSES = ['pending', 'approved'];

/**
 * Menentukan status kehadiran seorang siswa pada satu tanggal tertentu.
 * Ini adalah SATU-SATUNYA sumber kebenaran yang dipakai baik oleh
 * createAbsensi, createPermission, deletePermission, maupun endpoint
 * status untuk frontend — supaya aturan tidak pernah saling bertentangan
 * antara satu tempat dengan tempat lain.
 *
 * @param {number} userId
 * @param {Date|string} dateInput - Date object atau string "YYYY-MM-DD"
 * @returns {{
 *   date: Date,
 *   attendance: object|null,
 *   permission: object|null,
 *   status: 'belum_ada'|'hadir'|'izin_pending'|'izin_approved'|'izin_rejected',
 *   canCheckIn: boolean,
 *   canRequestPermission: boolean,
 *   canDeletePermission: boolean,
 * }}
 */
export const getDailyAttendanceStatus = async (userId, dateInput) => {
  const date = parseDateOnly(dateInput);
  const dateRange = sameDateRange(date);

  const [attendance, permission] = await Promise.all([
    prisma.absensi.findFirst({ where: { userId, date: dateRange } }),
    // Ambil permission TERBARU untuk tanggal ini, apapun statusnya
    // (termasuk rejected), supaya status "izin_rejected" tetap bisa
    // ditampilkan di UI/laporan meskipun sudah tidak mengunci tanggal
    // (misalnya setelah siswa mengajukan ulang izin baru).
    prisma.permission.findFirst({
      where: { userId, date: dateRange },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const permissionIsActive = !!permission && ACTIVE_PERMISSION_STATUSES.includes(permission.status);

  let status = 'belum_ada';
  if (attendance) status = 'hadir';
  else if (permission?.status === 'approved') status = 'izin_approved';
  else if (permission?.status === 'pending') status = 'izin_pending';
  else if (permission?.status === 'rejected') status = 'izin_rejected';

  const canCheckIn = !attendance && !permissionIsActive;
  const canRequestPermission = !attendance && !permissionIsActive;
  const canDeletePermission = !attendance && permission?.status === 'pending';

  return { date, attendance, permission, status, canCheckIn, canRequestPermission, canDeletePermission };
};
