import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';

const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const userInclude = {
  teacher: { select: { name: true } },
  class: { select: { name: true, major: true } },
  company: { select: { name: true, address: true, latitude: true, longitude: true, radiusMeters: true } },
  mentoredCompanies: { take: 1, select: { name: true, address: true, latitude: true, longitude: true, radiusMeters: true } },
};

const toFrontendUser = (user) => {
  const isMentor = user.role === 'mentor';
  const company = isMentor ? user.mentoredCompanies?.[0] : user.company;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: company?.name ?? null,
    companyAddress: company?.address ?? null,
    companyLocation: company && company.latitude != null
      ? { lat: company.latitude, lng: company.longitude, radius: company.radiusMeters ?? 500 }
      : null,
    teacherName: user.teacher?.name ?? null,
    className: user.class?.name ?? null,
    major: user.class?.major ?? null,
    academicYear: user.academicYear ?? null,
  };
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: userInclude });
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun dinonaktifkan. Hubungi admin.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

    res.json({ token: generateToken(user), user: toFrontendUser(user) });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, classId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: 'student',
        classId: classId ? parseInt(classId) : null,
      },
      include: userInclude,
    });

    res.status(201).json({ token: generateToken(user), user: toFrontendUser(user) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: userInclude,
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json(toFrontendUser(user));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Password lama salah' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password harus diisi untuk menghapus akun' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Password salah' });
    }

    await prisma.user.delete({ where: { id: user.id } });

    res.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
