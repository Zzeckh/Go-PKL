import prisma from '../config/db.js';

/**
 * GET /api/companies — list dengan stats (semua role login bisa lihat)
 */
export const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        mentor: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });
    res.json({
      data: companies.map(({ _count, mentor, ...rest }) => ({
        ...rest,
        filled: _count.students,
        mentor,
      })),
    });
  } catch (error) { next(error); }
};

/**
 * POST /api/companies — hubin only
 */
export const createCompany = async (req, res, next) => {
  try {
    const { name, address, category, quota, latitude, longitude, radiusMeters, mentorId } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Nama dan alamat perusahaan wajib diisi' });
    }
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Koordinat geofence (latitude/longitude) wajib diisi' });
    }

    // Validasi mentor (opsional) harus user role mentor
    if (mentorId) {
      const mentor = await prisma.user.findUnique({ where: { id: Number(mentorId) } });
      if (!mentor || mentor.role !== 'mentor') {
        return res.status(400).json({ error: 'mentorId harus user dengan role mentor' });
      }
    }

    const company = await prisma.company.create({
      data: {
        name,
        address,
        category: category ?? null,
        quota: Number(quota) || 0,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters) || 500,
        mentorId: mentorId ? Number(mentorId) : null,
      },
    });

    res.status(201).json(company);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Nama perusahaan sudah terdaftar' });
    next(error);
  }
};

/**
 * PATCH /api/companies/:id — hubin only
 * Termasuk edit koordinat geofence & ganti mentor
 */
export const updateCompany = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, address, category, quota, latitude, longitude, radiusMeters, mentorId, isActive } = req.body;

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Perusahaan tidak ditemukan' });

    if (mentorId) {
      const mentor = await prisma.user.findUnique({ where: { id: Number(mentorId) } });
      if (!mentor || mentor.role !== 'mentor') {
        return res.status(400).json({ error: 'mentorId harus user dengan role mentor' });
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: name ?? undefined,
        address: address ?? undefined,
        category: category ?? undefined,
        quota: quota !== undefined ? Number(quota) : undefined,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        radiusMeters: radiusMeters !== undefined ? Number(radiusMeters) : undefined,
        mentorId: mentorId !== undefined ? Number(mentorId) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.json(company);
  } catch (error) { next(error); }
};

/**
 * DELETE /api/companies/:id — soft delete (isActive=false), hubin only
 */
export const deactivateCompany = async (req, res, next) => {
  try {
    const company = await prisma.company.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });
    res.json(company);
  } catch (error) { next(error); }
};