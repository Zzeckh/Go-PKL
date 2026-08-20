import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import prisma from '../config/db.js';

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
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF yang diperbolehkan.'));
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
      return res.status(400).json({ error: 'Surat keterangan (file PDF) wajib diunggah.' });
    }

    const attachmentUrl = `/uploads/permissions/${req.file.filename}`;

    const permission = await prisma.permission.create({
      data: {
        userId,
        type,
        reason,
        attachmentUrl,
        date: new Date(date),
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
