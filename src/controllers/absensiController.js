import prisma from "../config/db.js";
import { parseDateOnly, sameDateRange } from '../utils/dateOnly.js';
import { getDailyAttendanceStatus } from '../services/attendanceStatusService.js';

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const getAllAbsensi = async (req, res, next) => {
  try {
    const { id, role } = req.user || {};
    let where = {};

    if (role === 'student') {
      where = { userId: id };
    } else if (role === 'teacher') {
      where = { user: { teacherId: id } };
    } else if (role === 'mentor') {
      where = { user: { company: { mentorId: id } } };
    }
    // hubin & super_admin see all

    /* Filter bulanan opsional: GET /api/absensi?month=YYYY-MM
       (berdasarkan tanggal kalender Asia/Jakarta) */
    const month = typeof req.query.month === 'string' ? req.query.month.trim() : '';
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Format month harus YYYY-MM' });
      }
      const [y, m] = month.split('-').map(Number);
      if (m < 1 || m > 12) {
        return res.status(400).json({ error: 'Bulan tidak valid' });
      }
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      where = { ...where, date: { gte: start, lt: end } };
    }

    const absensi = await prisma.absensi.findMany({
      where,
      include: { user: { select: { id: true, name: true, class: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(absensi);
  } catch (error) {
    next(error);
  }
};

export const createAbsensi = async (req, res, next) => {
  try {
    const { status, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: "status wajib diisi" });
    }

    // Radius check (server-side, authoritative)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    const company = user?.company;
    if (
      company &&
      company.isActive &&
      company.latitude != null &&
      company.longitude != null
    ) {
      if (latitude == null || longitude == null) {
        return res.status(400).json({ error: "Koordinat absensi tidak ditemukan. Aktifkan GPS dan coba lagi." });
      }
      const radius = company.radiusMeters ?? 500;
      const dist = haversineMeters(
        Number(latitude),
        Number(longitude),
        company.latitude,
        company.longitude
      );
      if (dist > radius) {
        return res.status(403).json({
          error: `Anda berada di luar radius area PKL (${dist}m > ${radius}m). Absensi tidak dapat dikirim.`,
        });
      }
    }

    const today = parseDateOnly(req.body.date) || parseDateOnly(new Date());

    const daily = await getDailyAttendanceStatus(userId, today);

    if (daily.attendance) {
      return res.status(409).json({ error: "Anda sudah melakukan absensi pada tanggal ini." });
    }

    if (!daily.canCheckIn) {
      // Ada izin aktif (pending ATAU approved) yang mengunci tanggal ini —
      // tidak perlu menunggu izin di-approve untuk memblokir absensi.
      return res.status(409).json({ error: 'Anda sudah mengajukan izin untuk tanggal ini sehingga tidak dapat melakukan absensi.' });
    }

    const absensi = await prisma.absensi.create({
      data: {
        userId,
        date: today,
        status: status || 'hadir',
        checkInTime: new Date(),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    res.status(201).json(absensi);
  } catch (error) {
    next(error);
  }
};

// GET /api/absensi/status?date=YYYY-MM-DD (default: hari ini, Asia/Jakarta)
// Sumber kebenaran untuk frontend: canCheckIn, canRequestPermission,
// canDeletePermission, dan status ('belum_ada' | 'hadir' | 'izin_pending' |
// 'izin_approved' | 'izin_rejected'). Frontend TIDAK boleh menghitung ulang
// aturan ini sendiri (lihat getDailyAttendanceStatus di attendanceStatusService.js).
export const getDailyStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dateInput = req.query.date ? String(req.query.date) : new Date();
    const daily = await getDailyAttendanceStatus(userId, dateInput);

    res.json({
      date: daily.date.toISOString().slice(0, 10),
      status: daily.status,
      canCheckIn: daily.canCheckIn,
      canRequestPermission: daily.canRequestPermission,
      canDeletePermission: daily.canDeletePermission,
      attendance: daily.attendance,
      permission: daily.permission,
    });
  } catch (error) {
    next(error);
  }
};

/* POST /api/absensi/checkout { latitude, longitude }
   Check-out untuk absensi HARI INI (Asia/Jakarta).
   Syarat: sudah check-in hari ini, belum check-out.
   Geofence divalidasi sama seperti check-in. */
export const checkoutAbsensi = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body || {};

    const today = parseDateOnly(new Date());
    const attendance = await prisma.absensi.findFirst({
      where: { userId, date: sameDateRange(today) },
      orderBy: { date: 'desc' },
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Belum ada absensi masuk hari ini.' });
    }
    if (attendance.checkOutTime) {
      return res.status(409).json({ error: 'Anda sudah melakukan absen pulang hari ini.' });
    }

    // Radius check (server-side, authoritative) — sama dengan check-in
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    const company = user?.company;
    if (
      company &&
      company.isActive &&
      company.latitude != null &&
      company.longitude != null
    ) {
      if (latitude == null || longitude == null) {
        return res.status(400).json({ error: 'Koordinat absensi tidak ditemukan. Aktifkan GPS dan coba lagi.' });
      }
      const radius = company.radiusMeters ?? 500;
      const dist = haversineMeters(
        Number(latitude),
        Number(longitude),
        company.latitude,
        company.longitude
      );
      if (dist > radius) {
        return res.status(403).json({
          error: `Anda berada di luar radius area PKL (${dist}m > ${radius}m). Absen pulang tidak dapat dikirim.`,
        });
      }
    }

    const updated = await prisma.absensi.update({
      where: { id: attendance.id },
      data: { checkOutTime: new Date() },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getAbsensiByUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const absensi = await prisma.absensi.findMany({
      where: { userId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(absensi);
  } catch (error) {
    next(error);
  }
};
