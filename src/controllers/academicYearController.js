import prisma from '../config/db.js';

/**
 * GET /api/academic-years
 * Mengambil semua tahun ajaran
 */
export const getAcademicYears = async (req, res, next) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(academicYears);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/academic-years/active
 * Mengambil tahun ajaran yang sedang aktif
 */
export const getActiveAcademicYear = async (req, res, next) => {
  try {
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!academicYear) {
      return res.status(404).json({
        error: 'Belum ada tahun ajaran aktif'
      });
    }

    res.json(academicYear);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/academic-years
 * Menambah tahun ajaran (Hubin).
 */
export const createAcademicYear = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        error: 'Nama tahun ajaran wajib diisi.'
      });
    }

    const cleanName = String(name).trim();

    const requestedActive =
      isActive === true ||
      isActive === 'true' ||
      isActive === 1 ||
      isActive === '1';

    const academicYear = await prisma.$transaction(async (tx) => {
      const activeCount = await tx.academicYear.count({
        where: { isActive: true }
      });

      // Tahun ajaran pertama otomatis aktif.
      const shouldActivate = requestedActive || activeCount === 0;

      if (shouldActivate) {
        await tx.academicYear.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
      }

      return tx.academicYear.create({
        data: {
          name: cleanName,
          isActive: shouldActivate
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true
        }
      });
    });

    res.status(201).json(academicYear);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Nama tahun ajaran sudah terdaftar.'
      });
    }

    next(error);
  }
};

/**
 * PATCH /api/academic-years/:id
 * Mengubah nama dan/atau status aktif tahun ajaran (Hubin).
 */
export const updateAcademicYear = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID tahun ajaran tidak valid.'
      });
    }

    const { name, isActive } = req.body;

    if (
      name !== undefined &&
      (!name || !String(name).trim())
    ) {
      return res.status(400).json({
        error: 'Nama tahun ajaran wajib diisi.'
      });
    }

    const existing = await prisma.academicYear.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Tahun ajaran tidak ditemukan.'
      });
    }

    const hasIsActive = isActive !== undefined;

    const requestedActive =
      isActive === true ||
      isActive === 'true' ||
      isActive === 1 ||
      isActive === '1';

    const academicYear = await prisma.$transaction(async (tx) => {
      if (hasIsActive && requestedActive) {
        await tx.academicYear.updateMany({
          where: {
            isActive: true,
            id: { not: id }
          },
          data: { isActive: false }
        });
      }

      return tx.academicYear.update({
        where: { id },
        data: {
          ...(name !== undefined
            ? { name: String(name).trim() }
            : {}),
          ...(hasIsActive
            ? { isActive: requestedActive }
            : {})
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true
        }
      });
    });

    res.json(academicYear);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Nama tahun ajaran sudah terdaftar.'
      });
    }

    next(error);
  }
};

/**
 * DELETE /api/academic-years/:id
 * Menghapus tahun ajaran yang belum dipakai data lain (Hubin).
 */
export const deleteAcademicYear = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID tahun ajaran tidak valid.'
      });
    }

    const existing = await prisma.academicYear.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Tahun ajaran tidak ditemukan.'
      });
    }

    const [users, classes, companies] = await Promise.all([
      prisma.user.count({ where: { academicYearId: id } }),
      prisma.class.count({ where: { academicYearId: id } }),
      prisma.company.count({ where: { academicYearId: id } })
    ]);

    if (users > 0 || classes > 0 || companies > 0) {
      return res.status(409).json({
        error:
          'Tahun ajaran masih dipakai data lain. Pindahkan atau hapus data terkait terlebih dahulu.',
        details: {
          users,
          classes,
          companies
        }
      });
    }

    await prisma.academicYear.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tahun ajaran berhasil dihapus.'
    });
  } catch (error) {
    next(error);
  }
};