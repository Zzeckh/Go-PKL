import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import prisma from '../config/db.js';
import { parseDateOnly, sameDateRange } from '../utils/dateOnly.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve('uploads/permissions');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .slice(-40);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

export const uploadPermissionFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan.'));
    }
  },
});

export const getPermissions = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let where = {};

    if (role === 'student') {
      where = { userId: id };
    } else if (role === 'teacher') {
      where = { user: { teacherId: id } };
    } else if (role === 'mentor') {
      where = { user: { company: { mentorId: id } } };
    } else if (role === 'hubin') {
      where = {};
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(permissions);
  } catch (error) {
    next(error);
  }
};

export const createPermission = async (req, res, next) => {
  try {
    const { type, reason, date } = req.body;
    const userId = req.user.id;

    if (!type || !reason || !date) {
      return res.status(400).json({ error: 'Type, reason, dan date wajib diisi' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Bukti gambar wajib diunggah.' });
    }

    const normalizedDate = parseDateOnly(date);
    const dateRange = sameDateRange(normalizedDate);
    if (!normalizedDate || !dateRange) {
      return res.status(400).json({ error: 'Format tanggal tidak valid.' });
    }

    const existingAbsensi = await prisma.absensi.findFirst({
      where: { userId, date: dateRange },
    });
    if (existingAbsensi) {
      return res.status(400).json({ error: 'Anda sudah melakukan absensi pada tanggal tersebut, sehingga tidak dapat mengajukan izin.' });
    }

    const existingPermission = await prisma.permission.findFirst({
      where: { userId, date: dateRange },
    });
    if (existingPermission) {
      return res.status(400).json({ error: 'Pengajuan izin untuk tanggal tersebut sudah ada.' });
    }

    const attachmentUrl = `/uploads/permissions/${req.file.filename}`;

    const permission = await prisma.permission.create({
      data: {
        userId,
        type,
        reason,
        attachmentUrl,
        date: normalizedDate,
        status: 'pending',
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    res.status(201).json(permission);
  } catch (error) {
    next(error);
  }
};

export const updatePermission = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status, rejectReason } = req.body;
    const { id: reviewerId, role } = req.user;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, teacherId: true, company: { select: { mentorId: true } } } },
      },
    });

    if (!permission) {
      return res.status(404).json({ error: 'Permission tidak ditemukan' });
    }

    let allowed = false;
    if (role === 'teacher') allowed = permission.user.teacherId === reviewerId;
    else if (role === 'mentor') allowed = permission.user.company?.mentorId === reviewerId;
    else if (role === 'hubin') allowed = true;
    else if (role === 'super_admin') allowed = true;

    if (!allowed) {
      return res.status(403).json({ error: 'Tidak berhak mengubah permission ini' });
    }

    if (status === 'approved') {
      const existingAbsensi = await prisma.absensi.findFirst({
        where: { userId: permission.user.id, date: sameDateRange(permission.date) || permission.date },
      });
      if (existingAbsensi) {
        return res.status(400).json({ error: 'Izin tidak dapat disetujui karena siswa sudah melakukan absensi pada tanggal tersebut.' });
      }
    }

    const updated = await prisma.permission.update({
      where: { id },
      data: {
        status,
        rejectReason: status === 'rejected' ? rejectReason : null,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
