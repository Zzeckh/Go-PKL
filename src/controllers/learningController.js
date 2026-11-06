import prisma from '../config/db.js';

/**
 * Empat tujuan pembelajaran awal. Nilai & deskripsi sengaja kosong agar
 * mentor mengisinya; baris dibuat otomatis saat logbook pertama kali dibuka.
 */
export const DEFAULT_LEARNING_GOALS = [
  'Menerapkan soft skills yang dibutuhkan dalam dunia kerja (tempat PKL).',
  'Menerapkan kompetensi teknis pada pekerjaan sesuai POS yang berlaku di dunia kerja.',
  'Menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari pada dunia kerja (tempat PKL).',
  'Memahami alur bisnis dunia kerja (tempat PKL).',
];

const httpError = (status, message) => Object.assign(new Error(message), { status });

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeWeeks = (value) => {
  if (!Array.isArray(value)) return null;
  const weeks = [...new Set(value.map(Number))];
  if (weeks.some((week) => !Number.isInteger(week) || week < 1 || week > 16)) {
    return null;
  }
  return weeks.sort((a, b) => a - b);
};

/**
 * Jalankan query dengan konteks aktor transaction-local. Konteks ini dipakai
 * policy RLS & trigger database sebagai lapisan pertahanan tambahan.
 */
const withActor = (user, work) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.user_id', ${String(user.id)}, true), set_config('app.user_role', ${String(user.role)}, true)`;
    return work(tx);
  });

const studentSelect = {
  id: true,
  name: true,
  nis: true,
  concentration: true,
  address: true,
  role: true,
  teacherId: true,
  class: { select: { name: true, major: true } },
  company: { select: { id: true, name: true, address: true, mentorId: true } },
  teacher: { select: { id: true, name: true } },
};

const signatureSelect = { id: true, name: true };

const achievementInclude = {
  mentorSignedBy: { select: signatureSelect },
  teacherSignedBy: { select: signatureSelect },
};

const getStudent = async (tx, studentId) => {
  const student = await tx.user.findUnique({
    where: { id: studentId },
    select: studentSelect,
  });

  if (!student || student.role !== 'student') return null;
  return student;
};

const getAccess = (actor, student) => {
  const isOwner = actor.id === student.id;
  const isHubin = actor.role === 'hubin';
  const isTeacher = actor.role === 'teacher' && student.teacherId === actor.id;
  const isMentor = actor.role === 'mentor' && student.company?.mentorId === actor.id;

  return {
    canView: isOwner || isHubin || isTeacher || isMentor,
    canManageAchievements: isMentor,
    canSignMentor: isMentor,
    canSignTeacher: isTeacher,
    canEditGoals: isMentor,
  };
};

const assertCanView = async (tx, actor, studentId) => {
  const student = await getStudent(tx, studentId);
  if (!student) throw httpError(404, 'Siswa tidak ditemukan.');

  const access = getAccess(actor, student);
  if (!access.canView) {
    throw httpError(403, 'Siswa ini berada di luar cakupan akses Anda.');
  }

  return { student, access };
};

const serializeStudent = (student) => ({
  id: student.id,
  name: student.name,
  nis: student.nis,
  concentration: student.concentration,
  address: student.address,
  className: student.class?.name ?? null,
  major: student.class?.major ?? null,
  companyName: student.company?.name ?? null,
  companyAddress: student.company?.address ?? null,
  teacherName: student.teacher?.name ?? null,
  program: student.concentration || student.class?.major || null,
  practicePlace: student.company?.name ?? null,
});

const serializeAchievement = (achievement) => ({
  id: achievement.id,
  orderIndex: achievement.orderIndex,
  title: achievement.title,
  evidence: achievement.evidence,
  weeks: [...new Set(achievement.weeks ?? [])].sort((a, b) => a - b),
  mentorSignedAt: achievement.mentorSignedAt,
  mentorSignedBy: achievement.mentorSignedBy,
  teacherSignedAt: achievement.teacherSignedAt,
  teacherSignedBy: achievement.teacherSignedBy,
});

const serializeGoal = (goal) => ({
  id: goal.id,
  orderIndex: goal.orderIndex,
  title: goal.title,
  score: goal.score,
  description: goal.description,
});

const ensureGoalTemplate = async (tx, studentId) => {
  await tx.learningGoal.createMany({
    data: DEFAULT_LEARNING_GOALS.map((title, index) => ({
      studentId,
      orderIndex: index + 1,
      title,
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });
};

/** GET /api/learning/students/:studentId/achievements — Fitur Capaian Pembelajaran */
export const getLearningAchievements = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'ID siswa tidak valid.' });

    const payload = await withActor(req.user, async (tx) => {
      const { student, access } = await assertCanView(tx, req.user, studentId);

      const achievements = await tx.learningAchievement.findMany({
        where: { studentId },
        include: achievementInclude,
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      });

      return {
        student: serializeStudent(student),
        achievements: achievements.map(serializeAchievement),
        access,
      };
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
};

/** GET /api/learning/students/:studentId/goals — Fitur Tujuan Pembelajaran */
export const getLearningGoals = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'ID siswa tidak valid.' });

    const payload = await withActor(req.user, async (tx) => {
      const { student, access } = await assertCanView(tx, req.user, studentId);

      await ensureGoalTemplate(tx, studentId);

      const goals = await tx.learningGoal.findMany({
        where: { studentId },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      });

      return {
        student: serializeStudent(student),
        goals: goals.map(serializeGoal),
        access,
      };
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
};

/** POST /api/learning/students/:studentId/achievements */
export const createAchievement = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'ID siswa tidak valid.' });

    const created = await withActor(req.user, async (tx) => {
      const { access } = await assertCanView(tx, req.user, studentId);
      if (!access.canManageAchievements) {
        throw httpError(403, 'Hanya mentor pembimbing yang dapat menambah capaian.');
      }

      const total = await tx.learningAchievement.count({ where: { studentId } });
      if (total >= 100) {
        throw httpError(400, 'Jumlah capaian pembelajaran sudah mencapai batas maksimum.');
      }

      const aggregate = await tx.learningAchievement.aggregate({
        where: { studentId },
        _max: { orderIndex: true },
      });
      const orderIndex = (aggregate._max.orderIndex ?? 0) + 1;

      const rawTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
      const rawEvidence = typeof req.body.evidence === 'string' ? req.body.evidence.trim() : '';

      return tx.learningAchievement.create({
        data: {
          studentId,
          orderIndex,
          title: rawTitle || `Capaian pembelajaran ${orderIndex}`,
          evidence: rawEvidence || null,
          weeks: [],
        },
        include: achievementInclude,
      });
    });

    res.status(201).json(serializeAchievement(created));
  } catch (error) {
    next(error);
  }
};

/** PUT /api/learning/students/:studentId/achievements/:achievementId */
export const updateAchievement = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    const achievementId = parseId(req.params.achievementId);
    if (!studentId || !achievementId) {
      return res.status(400).json({ error: 'ID siswa atau capaian tidak valid.' });
    }

    const updated = await withActor(req.user, async (tx) => {
      const { access } = await assertCanView(tx, req.user, studentId);
      if (!access.canManageAchievements) {
        throw httpError(403, 'Hanya mentor pembimbing yang dapat mengubah capaian.');
      }

      const existing = await tx.learningAchievement.findFirst({
        where: { id: achievementId, studentId },
      });
      if (!existing) throw httpError(404, 'Capaian pembelajaran tidak ditemukan.');

      const data = {};

      if (req.body.title !== undefined) {
        if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
          throw httpError(400, 'Capaian pembelajaran wajib diisi.');
        }
        data.title = req.body.title.trim();
      }

      if (req.body.evidence !== undefined) {
        if (req.body.evidence !== null && typeof req.body.evidence !== 'string') {
          throw httpError(400, 'Bukti pembelajaran tidak valid.');
        }
        data.evidence = typeof req.body.evidence === 'string' ? req.body.evidence.trim() || null : null;
      }

      if (req.body.weeks !== undefined) {
        const weeks = normalizeWeeks(req.body.weeks);
        if (weeks === null) {
          throw httpError(400, 'Minggu harus berupa daftar angka 1 sampai 16.');
        }
        data.weeks = weeks;
      }

      if (!Object.keys(data).length) {
        throw httpError(400, 'Tidak ada data capaian yang diubah.');
      }

      return tx.learningAchievement.update({
        where: { id: existing.id },
        data,
        include: achievementInclude,
      });
    });

    res.json(serializeAchievement(updated));
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/learning/students/:studentId/achievements/:achievementId */
export const deleteAchievement = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    const achievementId = parseId(req.params.achievementId);
    if (!studentId || !achievementId) {
      return res.status(400).json({ error: 'ID siswa atau capaian tidak valid.' });
    }

    await withActor(req.user, async (tx) => {
      const { access } = await assertCanView(tx, req.user, studentId);
      if (!access.canManageAchievements) {
        throw httpError(403, 'Hanya mentor pembimbing yang dapat menghapus capaian.');
      }

      const existing = await tx.learningAchievement.findFirst({
        where: { id: achievementId, studentId },
        select: { id: true },
      });
      if (!existing) throw httpError(404, 'Capaian pembelajaran tidak ditemukan.');

      await tx.learningAchievement.delete({ where: { id: existing.id } });
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/learning/students/:studentId/achievements/:achievementId/signature */
export const setAchievementSignature = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    const achievementId = parseId(req.params.achievementId);
    if (!studentId || !achievementId) {
      return res.status(400).json({ error: 'ID siswa atau capaian tidak valid.' });
    }

    const signer = req.body.signer;
    if (!['mentor', 'teacher'].includes(signer)) {
      return res.status(400).json({ error: 'Jenis paraf harus mentor atau teacher.' });
    }
    if (typeof req.body.signed !== 'boolean') {
      return res.status(400).json({ error: 'Status paraf harus berupa boolean.' });
    }

    const updated = await withActor(req.user, async (tx) => {
      const { access } = await assertCanView(tx, req.user, studentId);

      if (signer === 'mentor' && !access.canSignMentor) {
        throw httpError(403, 'Hanya mentor pembimbing yang dapat memberikan paraf mentor.');
      }
      if (signer === 'teacher' && !access.canSignTeacher) {
        throw httpError(403, 'Hanya guru pembimbing yang dapat memberikan paraf sekolah.');
      }

      const existing = await tx.learningAchievement.findFirst({
        where: { id: achievementId, studentId },
        select: { id: true },
      });
      if (!existing) throw httpError(404, 'Capaian pembelajaran tidak ditemukan.');

      const signed = req.body.signed;
      const data = signer === 'mentor'
        ? {
            mentorSignedAt: signed ? new Date() : null,
            mentorSignedById: signed ? req.user.id : null,
          }
        : {
            teacherSignedAt: signed ? new Date() : null,
            teacherSignedById: signed ? req.user.id : null,
          };

      return tx.learningAchievement.update({
        where: { id: existing.id },
        data,
        include: achievementInclude,
      });
    });

    res.json(serializeAchievement(updated));
  } catch (error) {
    next(error);
  }
};

/** PUT /api/learning/students/:studentId/goals */
export const updateLearningGoals = async (req, res, next) => {
  try {
    const studentId = parseId(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'ID siswa tidak valid.' });

    if (!Array.isArray(req.body.goals) || !req.body.goals.length) {
      return res.status(400).json({ error: 'Daftar tujuan pembelajaran wajib diisi.' });
    }

    const goals = await withActor(req.user, async (tx) => {
      const { access } = await assertCanView(tx, req.user, studentId);
      if (!access.canEditGoals) {
        throw httpError(403, 'Hanya mentor pembimbing yang dapat menilai tujuan pembelajaran.');
      }

      const existingGoals = await tx.learningGoal.findMany({
        where: { studentId },
        select: { id: true },
      });
      const allowedIds = new Set(existingGoals.map((goal) => goal.id));

      const updates = req.body.goals.map((item) => {
        const id = parseId(item?.id);
        if (!id || !allowedIds.has(id)) {
          throw httpError(400, 'Daftar tujuan pembelajaran berisi item yang tidak valid.');
        }

        let score = item.score;
        if (score === '' || score === null || score === undefined) {
          score = null;
        } else {
          score = Number(score);
          if (!Number.isInteger(score) || score < 10 || score > 100) {
            throw httpError(400, 'Nilai tujuan pembelajaran harus bilangan bulat 10 sampai 100.');
          }
        }

        let description;
        if (item.description !== undefined) {
          if (item.description !== null && typeof item.description !== 'string') {
            throw httpError(400, 'Deskripsi tujuan pembelajaran tidak valid.');
          }
          description = typeof item.description === 'string'
            ? item.description.trim() || null
            : null;
        }

        return {
          id,
          data: {
            score,
            ...(description !== undefined && { description }),
          },
        };
      });

      for (const { id, data } of updates) {
        await tx.learningGoal.update({ where: { id }, data });
      }

      return tx.learningGoal.findMany({
        where: { studentId },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      });
    });

    res.json({ goals: goals.map(serializeGoal) });
  } catch (error) {
    next(error);
  }
};
