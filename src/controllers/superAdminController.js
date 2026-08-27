import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

/* ── Stats global ── */
export const getStats = async (req, res, next) => {
  try {
    const [totalClasses, totalStudents, totalTeachers, totalMentors, totalHubins] =
      await Promise.all([
        prisma.class.count(),
        prisma.user.count({ where: { role: 'student' } }),
        prisma.user.count({ where: { role: 'teacher' } }),
        prisma.user.count({ where: { role: 'mentor' } }),
        prisma.user.count({ where: { role: 'hubin' } }),
      ]);

    const [totalAbsensi, totalLogbooks, totalPermissions] = await Promise.all([
      prisma.absensi.count(),
      prisma.logbook.count(),
      prisma.permission.count(),
    ]);

    res.json({
      totalClasses,
      totalStudents,
      totalTeachers,
      totalMentors,
      totalHubins,
      totalCompanies: 0,
      totalAbsensi,
      totalLogbooks,
      totalPermissions,
    });
  } catch (error) {
    next(error);
  }
};

/* ── GET /api/super-admin/classes ── */
export const getClasses = async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { id: 'asc' },
    });

    const mapped = classes.map(c => ({
      id: c.id,
      name: c.name,
      major: c.major || '-',
      totalStudents: c._count.users,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

/* ── POST /api/super-admin/classes ── */
export const createClass = async (req, res, next) => {
  try {
    const { name, major } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama kelas wajib diisi.' });

    const existing = await prisma.class.findFirst({ where: { name } });
    if (existing) return res.status(409).json({ error: 'Nama kelas sudah terdaftar.' });

    const created = await prisma.class.create({
      data: { name, major: major || null },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

/* ── DELETE /api/super-admin/classes/:id ── */
export const deleteClass = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const usersCount = await prisma.user.count({ where: { classId: id } });
    if (usersCount > 0) {
      return res.status(400).json({
        error: `Kelas memiliki ${usersCount} siswa. Pindahkan siswa terlebih dahulu.`,
      });
    }
    await prisma.class.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ── GET /api/super-admin/classes/:id/students ── */
export const getClassStudents = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const foundClass = await prisma.class.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'student' },
          include: {
            company: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true } },
            _count: {
              select: { absensis: true, logbooks: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!foundClass) return res.status(404).json({ error: 'Kelas tidak ditemukan.' });

    const students = foundClass.users.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      isActive: s.isActive,
      academicYear: s.academicYear || '-',
      perusahaan: s.company?.name || '-',
      guruPembimbing: s.teacher?.name || '-',
      kehadiran: s._count.absensis,
      logbooks: s._count.logbooks,
    }));

    res.json({ id: foundClass.id, name: foundClass.name, major: foundClass.major || '-', students });
  } catch (error) {
    next(error);
  }
};

/* ── GET /api/super-admin/users ── */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role && role !== 'all') where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, major: true } },
      },
      orderBy: { id: 'desc' },
      take: 200,
    });

    const mapped = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      class: u.class?.name || '-',
      academicYear: u.academicYear || '-',
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

/* ── PATCH /api/super-admin/users/:id/toggle ── */
export const toggleUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Tidak dapat menonaktifkan super admin.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
    res.json({ id: updated.id, isActive: updated.isActive });
  } catch (error) {
    next(error);
  }
};

/* ── DELETE /api/super-admin/users/:id ── */
export const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Tidak dapat menghapus super admin.' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ── PATCH /api/super-admin/users/:id/role ── */
export const updateUserRole = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    const allowed = ['student', 'teacher', 'mentor', 'hubin'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Tidak dapat mengubah role super admin.' });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json({ id: updated.id, role: updated.role });
  } catch (error) {
    next(error);
  }
};

/* ── POST /api/super-admin/users/:id/reset-password ── */
export const resetPassword = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Tidak dapat mereset password super admin.' });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    res.json({ id: user.id, name: user.name, newPassword });
  } catch (error) {
    next(error);
  }
};
