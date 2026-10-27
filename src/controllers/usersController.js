import prisma from '../config/db.js';
import {
  SOURCE_LABEL,
  isInternalCategory,
  normalizeSource,
  getFilledBySource
} from '../services/quotaService.js';

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

export const getUsers = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { role: filterRole } = req.query;

    let where = {};

    if (role === 'teacher') {
      where = { teacherId: id };
    } else if (role === 'student') {
      where = { id };
    } else if (role === 'mentor') {
      where = { company: { mentorId: id } };
    } else if (role === 'hubin') {
      where = {};
    }

    if (filterRole) {
      where.role = filterRole;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            major: true
          }
        },

        teacher: {
          select: {
            id: true,
            name: true
          }
        },

        company: {
          select: {
            id: true,
            name: true,

            mentor: {
              select: {
                id: true,
                name: true
              }
            },

            // JUMLAH SISWA DI PERUSAHAAN
            _count: {
              select: {
                students: true
              }
            }
          }
        },

        evalAsStudent: {
          select: {
            type: true,
            score: true,
            period: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },

        _count: {
          select: {
            absensis: true,
            logbooks: true,
            students: true
          }
        }
      },

      orderBy: {
        id: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },

      include: {
        class: {
          select: {
            name: true,
            major: true
          }
        },

        teacher: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User tidak ditemukan'
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const {
      name,
      classId,
      teacherId,
      companyId,
      academicYear,
      placementType,
      placementSource
    } = req.body;

    // academicYear adalah kolom string biasa pada User (Model AcademicYear
    // TIDAK ada di schema / database). Kirim string kosong / null untuk
    // mengosongkan Tahun Ajaran siswa.
    let resolvedAcademicYear;
    if (academicYear !== undefined) {
      if (academicYear === null || String(academicYear).trim() === '') {
        resolvedAcademicYear = null;
      } else {
        resolvedAcademicYear = String(academicYear).trim();
      }
    }

    let resolvedCompanyId = companyId ? parseInt(companyId) : undefined;

    // Jalur kuota yang dipakai siswa: 'sekolah' | 'perusahaan'.
    // undefined = tidak diubah.
    let resolvedSource;

    // true bila penempatan di perusahaan sekolah (Internal): tanpa batas kuota.
    let isInternalPlacement = false;

    // Validasi jenis PKL: Internal = otomatis perusahaan sekolah (kategori
    // Internal); Eksternal = tidak boleh perusahaan sekolah, wajib pilih jalur.
    if (placementType !== undefined) {
      if (!['internal', 'eksternal'].includes(placementType)) {
        return res.status(400).json({ error: 'Jenis PKL tidak valid' });
      }

      if (placementType === 'internal') {
        const candidates = await prisma.company.findMany({
          where: { category: { not: null } },
          select: { id: true, category: true },
          orderBy: { id: 'asc' }
        });
        const school = candidates.find((c) => isInternalCategory(c.category));
        if (!school) {
          return res.status(400).json({
            error: 'Perusahaan sekolah (kategori Internal) belum dibuat'
          });
        }
        resolvedCompanyId = school.id;
        resolvedSource = 'sekolah';
        isInternalPlacement = true;
      } else {
        if (!resolvedCompanyId) {
          return res.status(400).json({
            error: 'Pilih perusahaan untuk PKL Eksternal'
          });
        }

        const chosen = await prisma.company.findUnique({
          where: { id: resolvedCompanyId },
          select: { category: true }
        });
        if (!chosen) {
          return res.status(404).json({ error: 'Perusahaan tidak ditemukan' });
        }
        if (isInternalCategory(chosen.category)) {
          return res.status(400).json({
            error: 'PKL Eksternal tidak boleh memilih perusahaan sekolah'
          });
        }

        resolvedSource = normalizeSource(placementSource);
        if (!resolvedSource) {
          return res.status(400).json({
            error: 'Pilih jalur kuota: Sekolah atau Perusahaan'
          });
        }
      }
    }

    const data = {
      name: name ?? undefined,
      classId: classId ? parseInt(classId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      companyId: resolvedCompanyId,
      placementSource: resolvedSource,
      academicYear: resolvedAcademicYear,
    };

    const include = {
      class: {
        select: {
          name: true
        }
      },

      teacher: {
        select: {
          name: true
        }
      }
    };

    const user = await prisma.$transaction(async (tx) => {
      // Cek kuota jalur hanya untuk penempatan eksternal.
      if (resolvedCompanyId && resolvedSource && !isInternalPlacement) {
        // Kunci baris perusahaan: dua penyimpanan bersamaan untuk
        // perusahaan yang sama dijalankan bergantian, sehingga kuota
        // tidak bisa terlewati.
        await tx.$queryRaw`SELECT id FROM company WHERE id = ${resolvedCompanyId} FOR UPDATE`;

        const company = await tx.company.findUnique({
          where: { id: resolvedCompanyId },
          select: { name: true, quotaSchool: true, quotaCompany: true }
        });

        if (!company) {
          throw httpError(404, 'Perusahaan tidak ditemukan');
        }

        // Hitung tanpa siswa ini, agar menyimpan ulang penempatan
        // yang sama tidak dianggap menambah isi.
        const filled = await getFilledBySource(tx, resolvedCompanyId, id);
        const capacity =
          resolvedSource === 'perusahaan'
            ? company.quotaCompany
            : company.quotaSchool;

        if (filled[resolvedSource] >= capacity) {
          throw httpError(
            400,
            `Kuota ${SOURCE_LABEL[resolvedSource]} di "${company.name}" sudah penuh (${filled[resolvedSource]}/${capacity})`
          );
        }
      }

      return tx.user.update({
        where: { id },
        data,
        include
      });
    });

    res.json(user);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.user.delete({
      where: {
        id
      }
    });

    res.json({
      success: true
    });
  } catch (error) {
    next(error);
  }
};