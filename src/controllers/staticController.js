import prisma from '../config/db.js';

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { mentor: { select: { name: true } }, _count: { select: { students: true } } },
    });
    res.json(companies.map(({ _count, mentor, ...rest }) => ({
      ...rest, filled: _count.students, mentor: mentor?.name || '',
    })));
  } catch (error) { next(error); }
};

export const getPerizinan = async (req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, company: { select: { name: true } } } } },
    });
    res.json(permissions.map((p) => ({
      id: p.id,
      name: p.user?.name || 'Unknown',
      company: p.user?.company?.name || '-',
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
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      include: { mentor: { select: { name: true } }, _count: { select: { students: true } } },
    });
    res.json(companies.map((c) => ({
      id: c.id,
      companyName: c.name,
      address: c.address,
      category: c.category || 'Umum',
      internsCount: c._count.students,
      mentorName: c.mentor?.name || '',
      coordX: c.longitude,
      coordY: c.latitude,
      distance: '-',
      status: 'active',
    })));
  } catch (error) { next(error); }
};