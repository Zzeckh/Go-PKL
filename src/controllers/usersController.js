import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

// ============================================================
// GET USERS
// ============================================================

export const getUsers = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { role: filterRole, academicYearId } = req.query;

    let where = {};

    if (role === 'teacher') {
      where = {
        teacherId: id,
      };
    } else if (role === 'student') {
      where = {
        id,
      };
    } else if (role === 'mentor') {
      where = {
        company: {
          mentorId: id,
        },
      };
    } else if (role === 'hubin') {
      where = {};
    }

    // ============================================================
    // FILTER ROLE
    // ============================================================

    if (filterRole) {
      where.role = filterRole;
    }

    // ============================================================
    // FILTER TAHUN AJARAN
    // ============================================================

    if (academicYearId) {
      const yearId = Number(academicYearId);

      if (!Number.isInteger(yearId) || yearId <= 0) {
        return res.status(400).json({
          error: 'academicYearId tidak valid.',
        });
      }

      where.academicYearId = yearId;
    }

    const users = await prisma.user.findMany({
      where,

      include: {
        class: {
          select: {
            id: true,
            name: true,
            major: true,
          },
        },

        teacher: {
          select: {
            id: true,
            name: true,
          },
        },

        company: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            quotaCompany: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,

            mentor: {
              select: {
                id: true,
                name: true,
              },
            },

            _count: {
              select: {
                students: true,
              },
            },
          },
        },

        // ========================================================
        // PERUSAHAAN YANG DIBIMBING MENTOR
        // ========================================================

        mentoredCompanies: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            quotaCompany: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,

            _count: {
              select: {
                students: true,
              },
            },
          },

          orderBy: {
            name: 'asc',
          },
        },

        // ========================================================
        // EVALUASI SISWA
        // ========================================================

        evalAsStudent: {
          select: {
            type: true,
            score: true,
            period: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },

        // ========================================================
        // COUNT
        // ========================================================

        _count: {
          select: {
            absensis: true,
            logbooks: true,
            students: true,
          },
        },
      },

      orderBy: {
        id: 'desc',
      },
    });

    // ============================================================
    // FORMAT RESPONSE
    // ============================================================

    const formattedUsers = users.map((user) => {
      const formattedCompany = user.company
        ? {
            ...user.company,

            // Alias untuk frontend lama
            quota: user.company.quotaCompany ?? 0,
          }
        : null;

      const formattedMentoredCompanies =
        user.mentoredCompanies?.map((company) => ({
          ...company,

          // Alias untuk frontend lama
          quota: company.quotaCompany ?? 0,
        })) ?? [];

      return {
        ...user,
        company: formattedCompany,
        mentoredCompanies: formattedMentoredCompanies,
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET TEACHER COMPANIES
// ============================================================

export const getTeacherCompanies = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { academicYearId } = req.query;

    const where = {
      students: {
        some: {
          role: 'student',
          teacherId: id,
        },
      },
    };

    // ============================================================
    // FILTER TAHUN AJARAN
    // ============================================================

    if (academicYearId) {
      const yearId = Number(academicYearId);

      if (!Number.isInteger(yearId) || yearId <= 0) {
        return res.status(400).json({
          error: 'academicYearId tidak valid.',
        });
      }

      where.academicYearId = yearId;
    }

    const companies = await prisma.company.findMany({
      where,

      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        country: true,
        quotaCompany: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
        isActive: true,

        mentor: {
          select: {
            id: true,
            name: true,
          },
        },

        _count: {
          select: {
            students: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });

    // ============================================================
    // FORMAT AGAR COMPATIBLE DENGAN FRONTEND LAMA
    // ============================================================

    const formattedCompanies = companies.map((company) => ({
      ...company,

      quota: company.quotaCompany ?? 0,

      mentor: company.mentor
        ? {
            id: company.mentor.id,
            name: company.mentor.name,
          }
        : null,
    }));

    res.json(formattedCompanies);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER BY ID
// ============================================================

export const getUserById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'ID user tidak valid',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },

      include: {
        class: {
          select: {
            id: true,
            name: true,
            major: true,
          },
        },

        teacher: {
          select: {
            id: true,
            name: true,
          },
        },

        company: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            quotaCompany: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,

            mentor: {
              select: {
                id: true,
                name: true,
              },
            },

            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    const result = {
      ...user,

      company: user.company
        ? {
            ...user.company,
            quota: user.company.quotaCompany ?? 0,
          }
        : null,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE MENTOR
// ============================================================

export const createMentor = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ============================================================
    // VALIDASI
    // ============================================================

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        error: 'Nama mentor wajib diisi.',
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        error: 'Email mentor wajib diisi.',
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        error: 'Password mentor minimal 6 karakter.',
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // ============================================================
    // CEK EMAIL
    // ============================================================

    const existingUser = await prisma.user.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email sudah digunakan.',
      });
    }

    // ============================================================
    // HASH PASSWORD
    // ============================================================

    const hashedPassword = await bcrypt.hash(
      String(password),
      10
    );

    // ============================================================
    // BUAT MENTOR
    // ============================================================

    const mentor = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: 'mentor',
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academicYearId: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Mentor berhasil dibuat.',
      data: mentor,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE USER
// ============================================================

export const updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'ID user tidak valid',
      });
    }

    // ============================================================
    // CEK HAK AKSES
    // ------------------------------------------------------------
    // Route PATCH /:id tidak lagi dibatasi di userRoutes.js,
    // jadi pengecekan role dilakukan di sini:
    // - hubin & teacher : boleh mengubah data pemetaan user
    // - role lain       : hanya boleh mengubah nama dirinya sendiri
    // ============================================================

    const requesterRole = req.user.role;

    const isPrivileged =
      requesterRole === 'hubin' || requesterRole === 'teacher';

    const isSelf = req.user.id === id;

    if (!isPrivileged && !isSelf) {
      return res.status(403).json({
        error: 'Anda tidak memiliki akses untuk mengubah user ini.',
      });
    }

    const {
      name,
      classId,
      teacherId,
      companyId,
      mentorName,
      academicYear,
    } = req.body;

    // ============================================================
    // ACADEMIC YEAR
    // ============================================================

    let resolvedAcademicYear;

    if (academicYear !== undefined) {
      if (
        academicYear === null ||
        String(academicYear).trim() === ''
      ) {
        resolvedAcademicYear = null;
      } else {
        resolvedAcademicYear = String(
          academicYear
        ).trim();
      }
    }

    // ============================================================
    // DATA USER
    // ============================================================

    const data = {
      name:
        name !== undefined
          ? String(name).trim()
          : undefined,

      classId:
        isPrivileged &&
        classId !== undefined &&
        classId !== null &&
        classId !== ''
          ? Number(classId)
          : undefined,

      teacherId:
        isPrivileged &&
        teacherId !== undefined &&
        teacherId !== null &&
        teacherId !== ''
          ? Number(teacherId)
          : undefined,

      companyId:
        isPrivileged &&
        companyId !== undefined &&
        companyId !== null &&
        companyId !== ''
          ? Number(companyId)
          : undefined,

      academicYear: isPrivileged
        ? resolvedAcademicYear
        : undefined,
    };

    // ============================================================
    // PASANG MENTOR KE PERUSAHAAN
    // ============================================================

    if (isPrivileged && mentorName && data.companyId) {
      const mentor = await prisma.user.findFirst({
        where: {
          name: String(mentorName).trim(),
          role: 'mentor',
        },

        select: {
          id: true,
        },
      });

      if (mentor) {
        await prisma.company.update({
          where: {
            id: data.companyId,
          },

          data: {
            mentorId: mentor.id,
          },
        });
      }
    }

    // ============================================================
    // UPDATE USER
    // ============================================================

    const user = await prisma.user.update({
      where: {
        id,
      },

      data,

      include: {
        class: {
          select: {
            id: true,
            name: true,
            major: true,
          },
        },

        teacher: {
          select: {
            id: true,
            name: true,
          },
        },

        company: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            quotaCompany: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,

            mentor: {
              select: {
                id: true,
                name: true,
              },
            },

            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    // ============================================================
    // FORMAT RESPONSE
    // ============================================================

    const result = {
      ...user,

      company: user.company
        ? {
            ...user.company,
            quota: user.company.quotaCompany ?? 0,
          }
        : null,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE USER
// ============================================================

export const deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'ID user tidak valid',
      });
    }

    // ============================================================
    // CEK USER
    // ============================================================

    const existing = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    // ============================================================
    // DELETE
    // ============================================================

    await prisma.user.delete({
      where: {
        id,
      },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};