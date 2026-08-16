import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
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