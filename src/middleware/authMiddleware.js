import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan.' });
    }

    const token = header.slice(7);

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { class: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun dinonaktifkan.' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      classId: user.classId,
    };

    next();
  } catch (error) {
    console.error('authenticate error:', error);
    next(error);
  }
};

export const requireRole = (...allowed) => (req, res, next) => {
  if (req.user?.role === 'super_admin') return next();
  if (allowed.includes(req.user?.role)) return next();
  return res.status(403).json({ error: 'Akses ditolak untuk role Anda.' });
};
