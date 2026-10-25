import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  let payload;

  try {
    payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }

  const userId = Number(payload?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }

  try {
    // Token saja tidak cukup: pastikan akun masih ada dan aktif.
    // Ini juga membuat perubahan role langsung berlaku tanpa menunggu
    // token kedaluwarsa.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Akun tidak ditemukan. Silakan login kembali.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Akun dinonaktifkan. Hubungi admin.',
      });
    }

    req.user = {
      ...payload,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

// Role guard: authorize('mentor', 'teacher') → hanya role tsb yang boleh lewat
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Token tidak ditemukan' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: `Akses ditolak untuk role: ${req.user.role}` });
  }
  next();
};
