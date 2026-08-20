import prisma from '../config/db.js';

export const getUsers = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { role: filterRole } = req.query;
    let where = {};

    if (role === 'teacher') {
      where = { teacherId: id };
    } else if (role === 'student') {
      where = { id };
    } else if (role === 'mentor') {
      where = { company: { mentorId: id } };
    } else if (role === 'hubin') {
      where = {};
    } else if (role === 'super_admin') {
      where = {};
    }

    if (filterRole) {
      where.role = filterRole;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, major: true } },
        teacher: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, mentor: { select: { name: true } } } },
        _count: {
          select: {
            absensis: true,
            logbooks: true,
            students: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        class: { select: { name: true, major: true } },
        teacher: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, classId, teacherId, companyId, mentorName } = req.body;

    const data = {
      name: name ?? undefined,
      classId: classId ? parseInt(classId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      companyId: companyId ? parseInt(companyId) : undefined,
    };

    if (mentorName) {
      const mentor = await prisma.user.findFirst({
        where: { name: mentorName, role: 'mentor' },
        select: { id: true },
      });
      if (mentor) {
        await prisma.company.update({
          where: { id: data.companyId },
          data: { mentorId: mentor.id },
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        class: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
