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
      select: {
        id: true,
        name: true,
        academicYearId: true,
        programKeahlianId: true,
        programKeahlian: { select: { id: true, name: true } },
        konsentrasiKeahlianId: true,
        konsentrasiKeahlian: { select: { id: true, name: true } },
      },
    });

    res.json(
      classes.map((c) => ({
        id: c.id,
        name: c.name,
        academicYearId: c.academicYearId,
        programKeahlianId: c.programKeahlianId,
        programKeahlian: c.programKeahlian?.name ?? null,
        konsentrasiKeahlianId: c.konsentrasiKeahlianId,
        konsentrasiKeahlian: c.konsentrasiKeahlian?.name ?? null,
        // Kompatibilitas API lama.
        major: c.programKeahlian?.name ?? null,
      }))
    );
  } catch (error) { next(error); }
};

export const getPrograms = async (req, res, next) => {
  try {
    const programs = await prisma.programKeahlian.findMany({
      orderBy: { name: 'asc' },
      include: {
        concentrations: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, programKeahlianId: true },
        },
        _count: { select: { classes: true } },
      },
    });

    res.json(
      programs.map((program) => ({
        id: program.id,
        name: program.name,
        concentrations: program.concentrations,
        totalClasses: program._count.classes,
      }))
    );
  } catch (error) { next(error); }
};
