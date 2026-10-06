import prisma from '../config/db.js';

export const getEvaluations = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let where;

    if (role === 'student') {
      where = { studentId: id };
    } else if (role === 'teacher' || role === 'mentor') {
      where = { evaluatorId: id };
    } else if (role === 'hubin') {
      where = {};
    } else {
      return res.status(403).json({ error: 'Akses evaluasi ditolak.' });
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        evaluator: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(evaluations);
  } catch (error) {
    next(error);
  }
};

export const createEvaluation = async (req, res, next) => {
  try {
    const { studentId, type, score, notes, period } = req.body;
    const evaluatorId = req.user.id;
    const parsedStudentId = Number(studentId);
    const parsedScore = Number(score);
    const expectedType = req.user.role === 'teacher'
      ? 'guru'
      : req.user.role === 'mentor'
        ? 'dudi'
        : null;

    if (
      !Number.isInteger(parsedStudentId) ||
      parsedStudentId <= 0 ||
      score === undefined ||
      !Number.isInteger(parsedScore) ||
      typeof period !== 'string' ||
      !period.trim()
    ) {
      return res.status(400).json({ error: 'studentId, type, score, dan period wajib diisi' });
    }

    if (!expectedType || type !== expectedType) {
      return res.status(403).json({ error: 'Role Anda tidak dapat membuat evaluasi dengan tipe tersebut.' });
    }

    const student = await prisma.user.findUnique({
      where: { id: parsedStudentId },
      select: {
        id: true,
        role: true,
        teacherId: true,
        company: {
          select: { mentorId: true },
        },
      },
    });

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
    }

    const canEvaluate = req.user.role === 'teacher'
      ? student.teacherId === evaluatorId
      : student.company?.mentorId === evaluatorId;

    if (!canEvaluate) {
      return res.status(403).json({ error: 'Siswa berada di luar cakupan bimbingan Anda.' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId: parsedStudentId,
        evaluatorId,
        type,
        score: parsedScore,
        notes,
        period: period.trim(),
      },
      include: {
        student: { select: { name: true } },
        evaluator: { select: { name: true } },
      },
    });

    res.status(201).json(evaluation);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Evaluasi untuk periode ini sudah ada' });
    }
    next(error);
  }
};

export const updateEvaluation = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { score, notes } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID evaluasi tidak valid.' });
    }

    if (score === undefined && notes === undefined) {
      return res.status(400).json({ error: 'Skor atau catatan evaluasi harus diisi.' });
    }

    const existing = await prisma.evaluation.findUnique({
      where: { id },
      select: { id: true, evaluatorId: true, type: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Evaluasi tidak ditemukan.' });
    }

    if (existing.evaluatorId !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat mengubah evaluasi yang Anda buat.' });
    }

    const expectedType = req.user.role === 'teacher'
      ? 'guru'
      : req.user.role === 'mentor'
        ? 'dudi'
        : null;

    if (!expectedType || existing.type !== expectedType) {
      return res.status(403).json({ error: 'Role Anda tidak dapat mengubah evaluasi ini.' });
    }

    const parsedScore = score === undefined ? undefined : Number(score);
    if (parsedScore !== undefined && !Number.isInteger(parsedScore)) {
      return res.status(400).json({ error: 'Skor harus berupa bilangan bulat.' });
    }

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        score: parsedScore,
        notes: notes === undefined ? undefined : notes,
      },
    });

    res.json(evaluation);
  } catch (error) {
    next(error);
  }
};
