import prisma from '../config/db.js';

export const getEvaluations = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let where = {};

    if (role === 'student') {
      where = { studentId: id };
    } else if (role === 'teacher') {
      where = { evaluatorId: id };
    } else if (role === 'hubin') {
      where = {};
    } else if (role === 'super_admin') {
      where = {};
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

    if (!studentId || !type || score === undefined || !period) {
      return res.status(400).json({ error: 'studentId, type, score, dan period wajib diisi' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId: parseInt(studentId),
        evaluatorId,
        type,
        score: parseInt(score),
        notes,
        period,
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
    const id = parseInt(req.params.id);
    const { score, notes } = req.body;

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: { score: parseInt(score), notes },
    });

    res.json(evaluation);
  } catch (error) {
    next(error);
  }
};
