import prisma from '../config/db.js';

const mentorSelect = { id: true, name: true, email: true, isActive: true };

/**
 * GET /api/mentor-mapping/teacher/companies
 * Teacher hanya melihat perusahaan yang memiliki siswa bimbingannya.
 */
export const getTeacherCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        students: {
          some: { role: 'student', teacherId: req.user.id },
        },
      },
      orderBy: { name: 'asc' },
      include: {
        mentor: { select: mentorSelect },
        registeredMentors: {
          where: { mentor: { role: 'mentor', isActive: true } },
          include: { mentor: { select: mentorSelect } },
          orderBy: { mentor: { name: 'asc' } },
        },
        students: {
          where: { role: 'student', teacherId: req.user.id },
          select: {
            id: true,
            name: true,
            class: { select: { name: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    res.json({
      data: companies.map((company) => ({
        id: company.id,
        name: company.name,
        address: company.address,
        mentor: company.mentor,
        registeredMentors: company.registeredMentors.map((item) => item.mentor),
        students: company.students,
        studentCount: company.students.length,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/mentor-mapping/teacher/companies/:companyId/mentor
 * Assignment berlaku untuk satu perusahaan, bukan satu siswa.
 */
export const assignCompanyMentor = async (req, res, next) => {
  try {
    const companyId = Number(req.params.companyId);
    const mentorId = Number(req.body.mentorId);

    if (!Number.isInteger(companyId) || companyId <= 0 || !Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: 'ID perusahaan atau mentor tidak valid.' });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        students: { some: { role: 'student', teacherId: req.user.id } },
      },
      select: { id: true, name: true, mentorId: true },
    });

    if (!company) {
      return res.status(404).json({ error: 'Perusahaan tidak ditemukan dalam daftar siswa bimbingan Anda.' });
    }

    const registration = await prisma.companyMentor.findUnique({
      where: { companyId_mentorId: { companyId, mentorId } },
      include: { mentor: { select: mentorSelect } },
    });

    if (!registration || registration.mentor.role !== 'mentor' || !registration.mentor.isActive) {
      return res.status(400).json({ error: 'Mentor harus terdaftar dan aktif pada perusahaan ini.' });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { mentorId },
      include: { mentor: { select: mentorSelect } },
    });

    res.json({
      message: `Mentor perusahaan ${updated.name} berhasil diperbarui.`,
      data: { companyId: updated.id, companyName: updated.name, mentor: updated.mentor },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/mentor-mapping/roster — daftar perusahaan dan roster mentor (Hubin). */
export const getCompanyMentorRoster = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        mentorId: true,
        mentor: { select: mentorSelect },
        registeredMentors: {
          include: { mentor: { select: mentorSelect } },
          orderBy: { mentor: { name: 'asc' } },
        },
      },
    });
    res.json({ data: companies.map((company) => ({
      ...company,
      registeredMentors: company.registeredMentors.map((item) => item.mentor),
    })) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/mentor-mapping/mentors — akun mentor aktif untuk roster Hubin. */
export const getAvailableMentors = async (req, res, next) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: 'mentor' },
      select: mentorSelect,
      orderBy: { name: 'asc' },
    });
    res.json({ data: mentors });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/mentor-mapping/roster/:companyId — Hubin mengelola roster,
 * bukan menetapkan mentor aktif. Mentor aktif tidak boleh dikeluarkan dari roster.
 */
export const updateCompanyMentorRoster = async (req, res, next) => {
  try {
    const companyId = Number(req.params.companyId);
    const rawIds = req.body.mentorIds;

    if (!Number.isInteger(companyId) || companyId <= 0 || !Array.isArray(rawIds)) {
      return res.status(400).json({ error: 'ID perusahaan atau daftar mentor tidak valid.' });
    }

    const mentorIds = [...new Set(rawIds.map(Number))];
    if (mentorIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ error: 'Daftar mentor berisi ID yang tidak valid.' });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, mentorId: true },
    });
    if (!company) return res.status(404).json({ error: 'Perusahaan tidak ditemukan.' });

    if (company.mentorId && !mentorIds.includes(company.mentorId)) {
      return res.status(409).json({ error: 'Mentor yang sedang ditetapkan tidak dapat dikeluarkan dari daftar. Tetapkan mentor lain terlebih dahulu.' });
    }

    if (mentorIds.length) {
      const existingRegistrations = await prisma.companyMentor.findMany({
        where: { companyId },
        select: { mentorId: true },
      });
      const existingIds = new Set(existingRegistrations.map((item) => item.mentorId));
      // Akun nonaktif yang sudah terdaftar boleh dipertahankan, tetapi tidak boleh
      // ditambahkan sebagai mentor baru. Ini menjaga roster lama tetap dapat disimpan.
      const newlyAddedIds = mentorIds.filter((id) => !existingIds.has(id) && id !== company.mentorId);
      if (newlyAddedIds.length) {
        const validMentors = await prisma.user.findMany({
          where: { id: { in: newlyAddedIds }, role: 'mentor', isActive: true },
          select: { id: true },
        });
        if (validMentors.length !== newlyAddedIds.length) {
          return res.status(400).json({ error: 'Mentor baru harus merupakan akun mentor yang aktif.' });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (mentorIds.length) {
        await tx.companyMentor.deleteMany({
          where: { companyId, mentorId: { notIn: mentorIds } },
        });
        await tx.companyMentor.createMany({
          data: mentorIds.map((mentorId) => ({ companyId, mentorId })),
          skipDuplicates: true,
        });
      } else {
        await tx.companyMentor.deleteMany({ where: { companyId } });
      }
    });

    const updated = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        mentor: { select: mentorSelect },
        registeredMentors: { include: { mentor: { select: mentorSelect } }, orderBy: { mentor: { name: 'asc' } } },
      },
    });

    res.json({
      message: 'Daftar mentor perusahaan berhasil disimpan.',
      data: {
        ...updated,
        registeredMentors: updated.registeredMentors.map((item) => item.mentor),
      },
    });
  } catch (error) {
    next(error);
  }
};
