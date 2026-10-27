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