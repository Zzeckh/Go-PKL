import prisma from '../config/db.js';

/**
 * GET /api/logbook
 * Scoped by role:
 *  - student  → logbook sendiri
 *  - mentor   → siswa di perusahaan yang dibimbing
 *  - teacher  → siswa bimbingannya
 *  - hubin/admin → satu sekolah
 * Response: { data, meta } (pagination)
 */
export const getAllLogbooks = async (req, res, next) => {
  try {
    const { id, role, schoolId } = req.user;
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const page = Math.max(1, parseInt(req.query.page) || 1);

    let where = {};
    if (role === 'student') {
      where = { userId: id };
    } else if (role === 'teacher') {
      where = { user: { teacherId: id } };
    } else if (role === 'mentor') {
      const company = await prisma.company.findFirst({ where: { mentorId: id }, select: { id: true } });
      where = { user: { companyId: company?.id ?? -1 } };
    } else {
      where = { user: { schoolId: schoolId ?? undefined } };
    }

    const [data, total] = await Promise.all([
      prisma.logbook.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          date: true,
          activityTitle: true,
          description: true,
          hours: true,
          category: true,
          status: true,
          feedback: true,
          reviewedAt: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.logbook.count({ where }),
    ]);

    res.json({ data, meta: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/logbook — hanya student
 * Status SELALU "pending" (tidak bisa di-set dari client)
 */
export const createLogbook = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya siswa yang dapat menulis logbook' });
    }

    const { activity_title, description, hours, category, date } = req.body;
    if (!activity_title || !description) {
      return res.status(400).json({ error: 'Judul aktivitas dan deskripsi wajib diisi' });
    }

    const logbook = await prisma.logbook.create({
      data: {
        userId: req.user.id,
        date: date ? new Date(date) : new Date(),
        activityTitle: activity_title,
        description,
        hours: Number(hours) || 0,
        category: category || null,
        status: 'pending',
      },
      select: {
        id: true, date: true, activityTitle: true, description: true,
        hours: true, category: true, status: true,
      },
    });

    res.status(201).json(logbook);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/logbook/:id
 *  - Owner (student) → edit konten, hanya selama status "pending"
 *  - Reviewer (mentor/teacher) → approve/reject + feedback
 */
export const updateLogbook = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { id: userId, role } = req.user;
    const { activity_title, description, hours, category, status, feedback } = req.body;

    const existing = await prisma.logbook.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });
    if (!existing) return res.status(404).json({ error: 'Logbook tidak ditemukan' });

    const isOwner = existing.userId === userId;
    const isReviewer = role === 'mentor' || role === 'teacher';

    // Owner: edit konten selama belum direview
    if (isOwner && !isReviewer) {
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Logbook sudah direview dan tidak bisa diedit' });
      }
      const updated = await prisma.logbook.update({
        where: { id },
        data: {
          activityTitle: activity_title ?? undefined,
          description: description ?? undefined,
          hours: hours !== undefined ? Number(hours) : undefined,
          category: category ?? undefined,
        },
      });
      return res.json(updated);
    }

    // Reviewer: approve / reject
    if (isReviewer) {
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status review harus 'approved' atau 'rejected'" });
      }
      const updated = await prisma.logbook.update({
        where: { id },
        data: {
          status,
          feedback: feedback ?? null,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      });
      return res.json(updated);
    }

    return res.status(403).json({ error: 'Anda tidak memiliki akses ke logbook ini' });
  } catch (error) {
    next(error);
  }
};