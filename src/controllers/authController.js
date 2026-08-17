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
      schoolId: user.schoolId ?? null,
      companyId: user.companyId ?? null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const userInclude = {
  school: { select: { name: true } },
  company: {
    select: { name: true, address: true, latitude: true, longitude: true, radiusMeters: true },
  },
  teacher: { select: { name: true } },
  class: { select: { name: true, major: true } },
};

const toFrontendUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  schoolName: user.school?.name ?? null,
  companyName: user.company?.name ?? null,
  companyAddress: user.company?.address ?? null,
  companyLocation:
    user.company?.latitude != null
      ? {
          lat: user.company.latitude,
          lng: user.company.longitude,
          radius: user.company.radiusMeters,
        }
      : null,
  teacherName: user.teacher?.name ?? null,
  className: user.class?.name ?? null,
  major: user.class?.major ?? null,
  academicYear: user.academicYear ?? null,
});

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: userInclude });
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun dinonaktifkan. Hubungi admin sekolah.' });
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
    const { name, email, password, institution } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });

    let school = null;
    if (institution) {
      school = await prisma.school.findFirst({ where: { name: institution } });
      if (!school) school = await prisma.school.create({ data: { name: institution } });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: 'student',
        schoolId: school?.id ?? null,
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