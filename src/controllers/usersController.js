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
        _count: {
          select: {
            absensis: true,
            logbooks: true,
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
    const { name, classId, teacherId } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        classId: classId ? parseInt(classId) : null,
        teacherId: teacherId ? parseInt(teacherId) : null,
      },
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
