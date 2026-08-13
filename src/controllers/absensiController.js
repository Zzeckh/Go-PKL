import prisma from "../config/db.js";

export const getAllAbsensi = async (req, res, next) => {
  try {
    const absensi = await prisma.absensi.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(absensi);
  } catch (error) {
    next(error);
  }
};

export const createAbsensi = async (req, res, next) => {
  try {
    const { userId, status, location, image_url } = req.body;

    if (!userId || !status || !location) {
      return res.status(400).json({ error: "userId, status, dan location diperlukan" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const absensi = await prisma.absensi.create({
      data: {
        userId: Number(userId),
        status,
        location,
        imageUrl: image_url || null,
      },
    });

    res.status(201).json(absensi);
  } catch (error) {
    next(error);
  }
};

export const getAbsensiByUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const absensi = await prisma.absensi.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(absensi);
  } catch (error) {
    next(error);
  }
};
