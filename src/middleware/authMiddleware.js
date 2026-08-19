import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan.' });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        school: true,
        class: true,
        company: true,
        teacher: true,
      },
    });

    if (!user) return res.status(401).json({ error: 'User tidak ditemukan.' });
    if (!user.isActive) return res.status(403).json({ error: 'Akun dinonaktifkan.' });

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      schoolId: user.schoolId,
      companyId: user.companyId,
      teacherId: user.teacherId,
      classId: user.classId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid.' });
  }
};

/**
 * Guard role — super_admin otomatis lolos semua.
 */
export const requireRole = (...allowed) => (req, res, next) => {
  if (req.user?.role === 'super_admin') return next();
  if (allowed.includes(req.user?.role)) return next();
  return res.status(403).json({ error: 'Akses ditolak.' });
};