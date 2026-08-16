import prisma from '../config/db.js';

/**
 * GET /api/evaluations — scoped by role
 */
export const getEvaluations = async (req, res, next) => {
  try {
    const { id, role, schoolId } = req.user;

    let where = {};
    if (role === 'student') where = { studentId: id };
    else if (role === 'teacher') where = { student: { teacherId: id } };
    else if (role === 'mentor') {
      const company = await prisma.company.findFirst({ where: { mentorId: id }, select: { id: true } });
      where = { student: { companyId: company?.id ?? -1 } };
    } else where = { student: { schoolId: schoolId ?? undefined } };

    const data = await prisma.evaluation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, type: true, score: true, comment: true, period: true, updatedAt: true,
        student: { select: { id: true, name: true } },
        evaluator: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    res.json({ data });
  } catch (error) { next(error); }
};

/**
 * GET /api/evaluations/rekap — agregat nilai per siswa (pakai groupBy, bukan load semua row)
 */
export const getRekap = async (req, res, next) => {
  try {
    const { id, role, schoolId } = req.user;

    let where = {};
    if (role === 'teacher') where = { student: { teacherId: id } };
    else if (role === 'mentor') {
      const company = await prisma.company.findFirst({ where: { mentorId: id }, select: { id: true } });
      where = { student: { companyId: company?.id ?? -1 } };
    } else if (role === 'hubin') where = { student: { schoolId: schoolId ?? undefined } };
    else if (role === 'student') where = { studentId: id };

    // Agregasi di level DB — hemat memori
    const grouped = await prisma.evaluation.groupBy({
      by: ['studentId', 'type'],
      _avg: { score: true },
      where,
    });

    const studentIds = [...new Set(grouped.map((g) => g.studentId))];
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true, name: true,
        company: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const rekap = students.map((s) => {
      const dudi = grouped.find((g) => g.studentId === s.id && g.type === 'dudi')?._avg.score;
      const guru = grouped.find((g) => g.studentId === s.id && g.type === 'guru')?._avg.score;
      const final = dudi != null && guru != null ? (dudi + guru) / 2 : dudi ?? guru ?? null;
      return {
        studentId: s.id,
        name: s.name,
        company: s.company?.name ?? '-',
        teacher: s.teacher?.name ?? '-',
        nilaiDudi: dudi != null ? Math.round(dudi * 10) / 10 : null,
        nilaiGuru: guru != null ? Math.round(guru * 10) / 10 : null,
        final: final != null ? Math.round(final * 10) / 10 : null,
      };
    });

    res.json({ data: rekap });
  } catch (error) { next(error); }
};

/**
 * POST /api/evaluations — upsert nilai
 * mentor → type "dudi", teacher → type "guru" (otomatis dari role)
 */
export const upsertEvaluation = async (req, res, next) => {
  try {
    const { id: evaluatorId, role } = req.user;
    const { studentId, score, comment, period = 'Final' } = req.body;

    if (role !== 'mentor' && role !== 'teacher') {
      return res.status(403).json({ error: 'Hanya mentor/guru yang dapat memberi nilai' });
    }
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return res.status(400).json({ error: 'Nilai harus antara 0-100' });
    }

    const student = await prisma.user.findUnique({
      where: { id: Number(studentId) },
      select: { id: true, role: true, teacherId: true, companyId: true },
    });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    // Scope check
    let allowed = false;
    if (role === 'teacher') allowed = student.teacherId === evaluatorId;
    else {
      const company = await prisma.company.findFirst({ where: { mentorId: evaluatorId }, select: { id: true } });
      allowed = !!company && student.companyId === company.id;
    }
    if (!allowed) return res.status(403).json({ error: 'Siswa ini bukan bimbingan Anda' });

    const type = role === 'mentor' ? 'dudi' : 'guru';

    const evaluation = await prisma.evaluation.upsert({
      where: {
        studentId_evaluatorId_type_period: {
          studentId: student.id,
          evaluatorId,
          type,
          period,
        },
      },
      update: { score: numScore, comment: comment ?? null, companyId: student.companyId },
      create: {
        studentId: student.id,
        evaluatorId,
        companyId: student.companyId,
        type,
        score: numScore,
        comment: comment ?? null,
        period,
      },
    });

    res.json(evaluation);
  } catch (error) { next(error); }
};