import prisma from '../config/db.js';

export const getPerizinan = async (req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
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
