import prisma from '../config/db.js';

/* ── GET /api/super-admin/stats — stats global ── */
export const getStats = async (req, res, next) => {
  try {
    const [totalSchools, totalStudents, totalTeachers, totalMentors, totalHubins, totalCompanies] =
      await Promise.all([
        prisma.school.count(),
        prisma.user.count({ where: { role: 'student' } }),
        prisma.user.count({ where: { role: 'teacher' } }),
        prisma.user.count({ where: { role: 'mentor' } }),
        prisma.user.count({ where: { role: 'hubin' } }),
        prisma.company.count(),
      ]);

    const [totalAbsensi, totalLogbooks, totalPermissions] = await Promise.all([
      prisma.absensi.count(),
      prisma.logbook.count(),
      prisma.permission.count(),
    ]);

    res.json({
      totalSchools,
      totalStudents,
      totalTeachers,
      totalMentors,
      totalHubins,
      totalCompanies,
      totalAbsensi,
      totalLogbooks,
      totalPermissions,
    });
  } catch (error) {
    next(error);
  }
};

/* ── GET /api/super-admin/schools — list semua sekolah ── */
export const getSchools = async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const mapped = schools.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      phone: s.phone,
      totalUsers: s._count.users,
      totalClasses: s._count.classes,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

/* ── POST /api/super-admin/schools — tambah sekolah ── */
export const createSchool = async (req, res, next) => {
  try {
    const { name, address, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama sekolah wajib diisi.' });

    const existing = await prisma.school.findFirst({ where: { name } });
    if (existing) return res.status(409).json({ error: 'Nama sekolah sudah terdaftar.' });

    const created = await prisma.school.create({
      data: { name, address: address || '', phone: phone || '' },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

/* ── DELETE /api/super-admin/schools/:id ── */
export const deleteSchool = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const usersCount = await prisma.user.count({ where: { schoolId: id } });
    if (usersCount > 0) {
      return res.status(400).json({
        error: `Sekolah memiliki ${usersCount} user. Hapus/pindahkan user terlebih dahulu.`,
      });
    }
    await prisma.school.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ── GET /api/super-admin/users — list semua user (lintas sekolah & role) ── */
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
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, major: true } },
        company: { select: { id: true, name: true } },
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
      school: u.school?.name || '-',
      class: u.class?.name || '-',
      company: u.company?.name || '-',
      academicYear: u.academicYear || '-',
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

/* ── PATCH /api/super-admin/users/:id/toggle — aktif/nonaktif user ── */
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

/* ── GET /api/super-admin/companies — semua perusahaan lintas sekolah ── */
export const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        mentor: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
      orderBy: { id: 'asc' },
    });

    const mapped = companies.map(c => ({
      id: c.id,
      name: c.name,
      address: c.address,
      quota: c.quota,
      filled: c._count.users,
      mentor: c.mentor?.name || '-',
      category: c.category || '',
      latitude: c.latitude,
      longitude: c.longitude,
      radiusMeters: c.radiusMeters,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};