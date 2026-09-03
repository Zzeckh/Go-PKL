import prisma from "../config/db.js";
import { parseDateOnly, sameDateRange } from '../utils/dateOnly.js';

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
    const dateRange = sameDateRange(today);

    const existing = await prisma.absensi.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      return res.status(409).json({ error: "Sudah melakukan absensi hari ini" });
    }

    const approvedPermission = await prisma.permission.findFirst({
      where: { userId, status: 'approved', date: dateRange || today },
    });
    if (approvedPermission) {
      return res.status(400).json({ error: 'Absensi tidak dapat dilakukan karena izin Anda telah disetujui untuk tanggal tersebut.' });
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
