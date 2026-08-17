import prisma from '../config/db.js';

/**
 * GET /api/users?role=student&page=1&limit=50
 * Scoped by role viewer, TIDAK pernah return password.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { id, role, schoolId } = req.user;
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const roleFilter = req.query.role;

    const where = {};
    if (roleFilter) where.role = roleFilter;

    if (role === 'student') {
      where.id = id;
    } else if (role === 'mentor') {
      const company = await prisma.company.findFirst({ where: { mentorId: id }, select: { id: true } });
      where.companyId = company?.id ?? -1;
    } else if (role === 'teacher' && (!roleFilter || roleFilter === 'student')) {
      where.teacherId = id;
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          academicYear: true,
          class: { select: { id: true, name: true, major: true } },
          school: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
          _count: { select: { absensis: true, logbooks: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data, meta: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};