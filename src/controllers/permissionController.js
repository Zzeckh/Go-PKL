import prisma from '../config/db.js';

/**
 * GET /api/permissions — scoped by role
 */
export const getPermissions = async (req, res, next) => {
  try {
    const { id, role, schoolId } = req.user;
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const page = Math.max(1, parseInt(req.query.page) || 1);

    let where = {};
    if (role === 'student') where = { userId: id };
    else if (role === 'teacher') where = { user: { teacherId: id } };
    else if (role === 'mentor') {
      const company = await prisma.company.findFirst({ where: { mentorId: id }, select: { id: true } });
      where = { user: { companyId: company?.id ?? -1 } };
    } else where = { user: { schoolId: schoolId ?? undefined } }; // hubin

    const [data, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, date: true, type: true, reason: true, attachmentUrl: true,
          status: true, rejectReason: true, reviewedAt: true, createdAt: true,
          user: { select: { id: true, name: true, company: { select: { name: true } } } },
        },
      }),
      prisma.permission.count({ where }),
    ]);

    res.json({ data, meta: { page, limit, total } });
  } catch (error) { next(error); }
};

/**
 * POST /api/permissions — hanya student
 */
export const createPermission = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya siswa yang dapat mengajukan izin' });
    }
    const { date, type, reason, attachmentUrl } = req.body;
    if (!date || !type || !reason) {
      return res.status(400).json({ error: 'Tanggal, jenis, dan alasan wajib diisi' });
    }
    if (!['sakit', 'izin'].includes(type)) {
      return res.status(400).json({ error: "Jenis harus 'sakit' atau 'izin'" });
    }

    const permission = await prisma.permission.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        type,
        reason,
        attachmentUrl: attachmentUrl || null,
        status: 'pending',
      },
    });

    res.status(201).json(permission);
  } catch (error) { next(error); }
};

/**
 * PUT /api/permissions/:id — review (approve/reject)
 * Bonus: kalau disetujui, otomatis buat record Absensi (izin/sakit) via $transaction
 */
export const reviewPermission = async (req, res, next) => {
  try {
    const { id: reviewerId, role, schoolId } = req.user;
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status harus 'approved' atau 'rejected'" });
    }

    const permission = await prisma.permission.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { id: true, teacherId: true, companyId: true, schoolId: true } } },
    });
    if (!permission) return res.status(404).json({ error: 'Perizinan tidak ditemukan' });
    if (permission.status !== 'pending') {
      return res.status(400).json({ error: 'Perizinan sudah direview sebelumnya' });
    }

    // Scope check reviewer
    const student = permission.user;
    let allowed = false;
    if (role === 'hubin') allowed = student.schoolId === schoolId;
    else if (role === 'teacher') allowed = student.teacherId === reviewerId;
    else if (role === 'mentor') {
      const company = await prisma.company.findFirst({ where: { mentorId: reviewerId }, select: { id: true } });
      allowed = !!company && student.companyId === company.id;
    }
    if (!allowed) return res.status(403).json({ error: 'Anda tidak berwenang mereview perizinan ini' });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.permission.update({
        where: { id: permission.id },
        data: {
          status,
          rejectReason: status === 'rejected' ? (rejectReason ?? null) : null,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      // Approved → catat kehadiran izin/sakit di tanggal tsb (jika belum ada)
      if (status === 'approved') {
        const existing = await tx.absensi.findFirst({
          where: { userId: student.id, date: permission.date },
        });
        if (!existing) {
          await tx.absensi.create({
            data: {
              userId: student.id,
              companyId: student.companyId,
              date: permission.date,
              status: permission.type, // 'sakit' | 'izin'
            },
          });
        }
      }
      return updated;
    });

    res.json(result);
  } catch (error) { next(error); }
};