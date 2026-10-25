import prisma from '../config/db.js';

export const getPerizinan = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    const where = {};

    if (role === 'student') {
      where.userId = id;
    } else if (role === 'teacher') {
      // Guru hanya melihat perizinan siswa bimbingannya.
      where.user = {
        teacherId: id,
      };
    } else if (role === 'mentor') {
      // Mentor hanya melihat perizinan siswa di perusahaannya.
      where.user = {
        company: {
          mentorId: id,
        },
      };
    } else if (role !== 'hubin') {
      return res.status(403).json({
        error: 'Akses ditolak untuk role Anda.',
      });
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, class: { select: { name: true } } } } },
    });
    res.json(permissions.map((p) => ({
      id: p.id,
      name: p.user?.name || 'Unknown',
      kelas: p.user?.class?.name || '-',
      date: p.date,
      type: p.type === 'sakit' ? 'Sakit' : 'Izin',
      reason: p.reason,
      attachment: p.attachmentUrl || '',
      status: p.status,
    })));
  } catch (error) { next(error); }
};

export const getMapLocations = async (req, res, next) => {
  try {
    res.json([]);
  } catch (error) { next(error); }
};

export const getClasses = async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, major: true },
    });
    res.json(classes);
  } catch (error) { next(error); }
};
