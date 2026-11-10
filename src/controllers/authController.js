
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';

// =====================================================
// GENERATE JWT TOKEN
// =====================================================
const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

// =====================================================
// RELASI USER
// =====================================================
const userInclude = {
  teacher: {
    select: {
      id: true,
      email: true,
      whatsapp: true,
    },
  },

  class: {
    select: {
      name: true,
      programKeahlian: {
        select: {
          id: true,
          name: true,
        },
      },
      konsentrasiKeahlian: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  company: {
    select: {
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
    },
  },

  mentoredCompanies: {
    take: 1,
    select: {
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
    },
  },
};

// =====================================================
// FORMAT USER UNTUK FRONTEND
// =====================================================
const toFrontendUser = (user) => {
  const isMentor = user.role === 'mentor';

  const company = isMentor
    ? user.mentoredCompanies?.[0]
    : user.company;

  return {
    id: user.id,

    // Fallback karena field name tidak tersedia
    // pada Prisma Client yang sedang aktif.
    name: user.name ?? user.email,

    email: user.email,
    whatsapp: user.whatsapp ?? null,

    nis: user.nis ?? null,
    gender: user.gender ?? null,
    birthPlace: user.birthPlace ?? null,
    birthDate: user.birthDate ?? null,
    nisn: user.nisn ?? null,
    nik: user.nik ?? null,
    religion: user.religion ?? null,

    concentration:
      user.concentration ??
      user.class?.konsentrasiKeahlian?.name ??
      null,

    address: user.address ?? null,
    parentName: user.parentName ?? null,
    parentAddress: user.parentAddress ?? null,
    parentPhone: user.parentPhone ?? null,

    schoolName: 'SMKN Negeri 11 Bandung',
    schoolAddress: 'Cilember, Bandung 40175',

    // NIP belum dapat diambil karena field tersebut
    // tidak tersedia pada Prisma Client aktif.
    teacherNip: null,

    role: user.role,

    companyName: company?.name ?? null,
    companyAddress: company?.address ?? null,

    companyLocation:
      company && company.latitude != null
        ? {
            lat: company.latitude,
            lng: company.longitude,
            radius: company.radiusMeters ?? 500,
          }
        : null,

    teacherName:
      user.teacher?.name ??
      user.teacher?.email ??
      null,

    className: user.class?.name ?? null,

    major: user.class?.programKeahlian?.name ?? null,

    programKeahlian:
      user.class?.programKeahlian ?? null,

    konsentrasiKeahlian:
      user.class?.konsentrasiKeahlian ?? null,

    academicYear: user.academicYear ?? null,
  };
};

// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email dan password harus diisi',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      include: userInclude,
    });

    if (!user) {
      return res.status(401).json({
        error: 'Email atau password salah',
      });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({
        error:
          'Role Super Admin sudah dihapus. Silakan gunakan akun Hubin.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Akun dinonaktifkan. Hubungi admin.',
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Email atau password salah',
      });
    }

    return res.json({
      token: generateToken(user),
      user: toFrontendUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET CURRENT USER
// GET /api/auth/me
// =====================================================
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      include: userInclude,
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    return res.json(toFrontendUser(user));
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Password lama dan baru harus diisi',
      });
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        error: 'Password baru minimal 6 karakter',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Password lama salah',
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashed,
      },
    });

    return res.json({
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// NORMALISASI WHATSAPP
// =====================================================
const normalizeWhatsapp = (raw) => {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();

  if (!trimmed) return null;

  if (!/^\+?[0-9]+$/.test(trimmed)) {
    return undefined;
  }

  let digits = trimmed.replace(/[^0-9]/g, '');

  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length < 9 || digits.length > 15) {
    return undefined;
  }

  return digits;
};

// =====================================================
// EMAIL VALIDATION
// =====================================================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =====================================================
// UPDATE PROFILE
// PUT /api/auth/profile
//
// Catatan:
// Saat ini hanya email dan whatsapp yang diubah
// karena keduanya tersedia pada Prisma Client aktif.
// =====================================================
export const updateProfile = async (req, res, next) => {
  try {
    const { email, whatsapp } = req.body;

    if (
      email === undefined &&
      whatsapp === undefined
    ) {
      return res.status(400).json({
        error: 'Tidak ada data profile yang diubah',
      });
    }

    const data = {};

    if (email !== undefined) {
      if (
        typeof email !== 'string' ||
        !EMAIL_RE.test(email.trim())
      ) {
        return res.status(400).json({
          error: 'Format email tidak valid',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const taken = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
      });

      if (taken && taken.id !== req.user.id) {
        return res.status(409).json({
          error: 'Email sudah dipakai akun lain',
        });
      }

      data.email = normalizedEmail;
    }

    if (whatsapp !== undefined) {
      if (
        typeof whatsapp !== 'string' ||
        whatsapp.trim() === ''
      ) {
        return res.status(400).json({
          error: 'Nomor WhatsApp tidak valid',
        });
      }

      const normalized = normalizeWhatsapp(whatsapp);

      if (normalized === undefined || normalized === null) {
        return res.status(400).json({
          error:
            'Nomor WhatsApp tidak valid (9-15 digit, boleh diawali +/62)',
        });
      }

      data.whatsapp = normalized;
    }

    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data,
      include: userInclude,
    });

    return res.json(toFrontendUser(user));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email sudah dipakai akun lain',
      });
    }

    next(error);
  }
};

// =====================================================
// UPDATE PASSWORD
// PUT /api/auth/password
// =====================================================
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Password saat ini dan baru harus diisi',
      });
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        error: 'Password baru minimal 6 karakter',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Password saat ini salah',
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashed,
      },
    });

    return res.json({
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE ACCOUNT
// DELETE /api/auth/account
// =====================================================
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password harus diisi untuk menghapus akun',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        error: 'Password salah',
      });
    }

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    return res.json({
      message: 'Akun berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};
