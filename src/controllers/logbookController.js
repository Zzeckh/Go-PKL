import prisma from '../config/db.js';

export const getLogbooks = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let where = {};

    if (role === 'student') {
      where = { userId: id };
    } else if (role === 'teacher') {
      where = { user: { teacherId: id } };
    } else if (role === 'mentor') {
      where = { user: { company: { mentorId: id } } };
    } else if (role === 'hubin') {
      where = {};
    } else if (role === 'super_admin') {
      where = {};
    }

    const logbooks = await prisma.logbook.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(logbooks);
  } catch (error) {
    next(error);
  }
};

export const createLogbook = async (req, res, next) => {
  try {
    const { activity_title, description, hours, category } = req.body;
    const userId = req.user.id;

    if (!activity_title || !description) {
      return res.status(400).json({ error: 'activity_title dan description wajib diisi' });
    }

    const logbook = await prisma.logbook.create({
      data: {
        userId,
        activityTitle: activity_title,
        description,
        hours: hours || 8,
        category: category || null,
        status: 'pending',
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json(logbook);
  } catch (error) {
    next(error);
  }
};

export const updateLogbook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status, feedback } = req.body;
    const { id: reviewerId, role } = req.user;

    const logbook = await prisma.logbook.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, teacherId: true, company: { select: { mentorId: true } } } },
      },
    });

    if (!logbook) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    let allowed = false;
    if (role === 'teacher') allowed = logbook.user.teacherId === reviewerId;
    else if (role === 'mentor') allowed = logbook.user.company?.mentorId === reviewerId;
    else if (role === 'hubin') allowed = true;
    else if (role === 'super_admin') allowed = true;

    if (!allowed) {
      return res.status(403).json({ error: 'Tidak berhak mengubah logbook ini' });
    }

    const updated = await prisma.logbook.update({
      where: { id },
      data: { status, feedback },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteLogbook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    const logbook = await prisma.logbook.findUnique({ where: { id } });
    if (!logbook) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    if (role === 'student' && logbook.userId !== userId) {
      return res.status(403).json({ error: 'Tidak berhak menghapus logbook ini' });
    }

    await prisma.logbook.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
