import prisma from "../config/db.js";

export const getAllLogbooks = async (req, res, next) => {
  try {
    const logbooks = await prisma.logbook.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(logbooks);
  } catch (error) {
    next(error);
  }
};

export const createLogbook = async (req, res, next) => {
  try {
    const { userId, date, activity_title, description, status } = req.body;

    if (!userId || !date || !activity_title || !description || !status) {
      return res.status(400).json({ error: "Semua field logbook harus diisi" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const logbook = await prisma.logbook.create({
      data: {
        userId: Number(userId),
        date: new Date(date),
        activityTitle: activity_title,
        description,
        status,
      },
    });

    res.status(201).json(logbook);
  } catch (error) {
    next(error);
  }
};

export const updateLogbook = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { activity_title, description, status, date } = req.body;

    const existingLogbook = await prisma.logbook.findUnique({ where: { id } });
    if (!existingLogbook) {
      return res.status(404).json({ error: "Logbook tidak ditemukan" });
    }

    const updatedLogbook = await prisma.logbook.update({
      where: { id },
      data: {
        activityTitle: activity_title ?? existingLogbook.activityTitle,
        description: description ?? existingLogbook.description,
        status: status ?? existingLogbook.status,
        date: date ? new Date(date) : existingLogbook.date,
      },
    });

    res.json(updatedLogbook);
  } catch (error) {
    next(error);
  }
};
