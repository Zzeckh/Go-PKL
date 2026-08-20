import prisma from "../config/db.js";

export const getAllAbsensi = async (req, res, next) => {
  try {
    const { id, role } = req.user || {};
    let where = {};

    if (role === 'student') {
      where = { userId: id };
    } else if (role === 'teacher') {
      where = { user: { teacherId: id } };
    } else if (role === 'mentor') {
      where = { user: { company: { mentorId: id } } };
    }
    // hubin & super_admin see all

    const absensi = await prisma.absensi.findMany({
      where,
      include: { user: { select: { id: true, name: true, class: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(absensi);
  } catch (error) {
    next(error);
  }
};

export const createAbsensi = async (req, res, next) => {
  try {
    const { status, image_url, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: "status wajib diisi" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.absensi.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      return res.status(409).json({ error: "Sudah melakukan absensi hari ini" });
    }

    const absensi = await prisma.absensi.create({
      data: {
        userId,
        date: today,
        status: status || 'hadir',
        checkInTime: new Date(),
        imageUrl: image_url || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
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
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(absensi);
  } catch (error) {
    next(error);
  }
};
