import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import {
  getUserDeletionBlockers,
  buildDeletionBlockedMessage,
} from '../services/userDeletionService.js';

// ============================================================
// GET USERS
// ============================================================

export const getUsers = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { role: filterRole, academicYearId } = req.query;

    let where = {};

    if (role === 'teacher') {
      if (filterRole === 'mentor') {
        // Guru hanya melihat mentor aktif pada perusahaan
        // tempat ia membimbing siswa.
        where = {
          mentoredCompanies: {
            some: {
              students: {
                some: {
                  role: 'student',
                  teacherId: id,
                },
              },
            },
          },
        };
      } else {
        where = {
          teacherId: id,
        };
      }
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
      // Jangan pernah kirim hash password ke client.
      const { password: _password, ...safeUser } = user;

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
        ...safeUser,
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

    // Jangan pernah kirim hash password ke client.
    const { password: _password, ...safeUser } = user;

    const result = {
      ...safeUser,

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
    const {
      name,
      email,
      password,
      whatsapp,
      companyId,
    } = req.body;

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

    const companyIdNumber = Number(companyId);

    if (
      !Number.isInteger(companyIdNumber) ||
      companyIdNumber <= 0
    ) {
      return res.status(400).json({
        error: 'Perusahaan wajib dipilih.',
      });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyIdNumber,
        students: {
          some: {
            role: 'student',
            teacherId: req.user.id,
          },
        },
      },

      select: {
        id: true,
        name: true,
        mentorId: true,
        academicYearId: true,
      },
    });

    if (!company) {
      return res.status(403).json({
        error:
          'Perusahaan tidak ditemukan atau bukan perusahaan bimbingan Anda.',
      });
    }

    if (company.mentorId) {
      return res.status(409).json({
        error: 'Perusahaan ini sudah memiliki mentor aktif.',
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
      select: { id: true },
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
    // BUAT MENTOR + HUBUNGKAN KE PERUSAHAAN
    // ============================================================

    const mentor = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          role: 'mentor',
          whatsapp:
            whatsapp !== undefined &&
            whatsapp !== null &&
            String(whatsapp).trim() !== ''
              ? String(whatsapp).trim()
              : null,
          companyId: company.id,
          academicYearId: company.academicYearId ?? null,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          whatsapp: true,
          companyId: true,
          academicYearId: true,
        },
      });

      await tx.company.update({
        where: { id: company.id },
        data: { mentorId: created.id },
      });

      await tx.companyMentor.upsert({
        where: {
          companyId_mentorId: {
            companyId: company.id,
            mentorId: created.id,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          mentorId: created.id,
        },
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'Mentor berhasil dibuat.',
      data: {
        ...mentor,
        companyName: company.name,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Email sudah digunakan.',
      });
    }

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

    const isSelf = req.user.id === id;

    // ============================================================
    // TARGET & BATASAN AKSES
    // ------------------------------------------------------------
    // - hubin  : boleh mengelola semua user
    // - guru   : hanya boleh mengubah nama siswa bimbingannya
    // - lainnya: hanya boleh mengubah nama sendiri
    // ============================================================

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        teacherId: true,
      },
    });

    if (!target) {
      return res.status(404).json({
        error: 'User tidak ditemukan.',
      });
    }

    const isHubin = requesterRole === 'hubin';

    const isTeacherOfTarget =
      requesterRole === 'teacher' &&
      target.role === 'student' &&
      target.teacherId === req.user.id;

    if (!isHubin && !isTeacherOfTarget && !isSelf) {
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
      academicYearId,
    } = req.body;

    const hasField = (key) =>
      Object.prototype.hasOwnProperty.call(
        req.body,
        key
      );

    const parseNullableId = (value, fieldName) => {
      if (value === null || value === '') {
        return { value: null };
      }

      const parsed = Number(value);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        return {
          error: `${fieldName} tidak valid.`,
        };
      }

      return { value: parsed };
    };

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

    let resolvedAcademicYearId;

    if (isHubin && hasField('academicYearId')) {
      const parsed = parseNullableId(
        academicYearId,
        'academicYearId'
      );

      if (parsed.error) {
        return res.status(400).json({
          error: parsed.error,
        });
      }

      resolvedAcademicYearId = parsed.value;

      if (resolvedAcademicYearId) {
        const year = await prisma.academicYear.findUnique({
          where: { id: resolvedAcademicYearId },
          select: { name: true },
        });

        if (!year) {
          return res.status(400).json({
            error: 'Tahun ajaran tidak ditemukan.',
          });
        }

        if (academicYear === undefined) {
          resolvedAcademicYear = year.name;
        }
      } else if (academicYear === undefined) {
        resolvedAcademicYear = null;
      }
    }

    // ============================================================
    // DATA USER
    // ============================================================

    let resolvedClassId;
    let resolvedTeacherId;
    let resolvedCompanyId;

    // Mapping hanya boleh diubah oleh Hubin. Nilai null/'' berarti
    // melepas pemetaan, bukan "field tidak dikirim".
    if (isHubin && hasField('classId')) {
      const parsed = parseNullableId(classId, 'classId');

      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }

      resolvedClassId = parsed.value;
    }

    if (isHubin && hasField('teacherId')) {
      const parsed = parseNullableId(
        teacherId,
        'teacherId'
      );

      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }

      resolvedTeacherId = parsed.value;
    }

    if (isHubin && hasField('companyId')) {
      const parsed = parseNullableId(
        companyId,
        'companyId'
      );

      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }

      resolvedCompanyId = parsed.value;
    }

    const data = {
      name:
        name !== undefined
          ? String(name).trim()
          : undefined,

      classId: resolvedClassId,

      teacherId: resolvedTeacherId,

      companyId: resolvedCompanyId,

      academicYear: isHubin
        ? resolvedAcademicYear
        : undefined,

      academicYearId: isHubin
        ? resolvedAcademicYearId
        : undefined,
    };

    // ============================================================
    // PASANG MENTOR KE PERUSAHAAN
    // ============================================================

    if (isHubin && mentorName && data.companyId) {
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

        await prisma.companyMentor.upsert({
          where: {
            companyId_mentorId: {
              companyId: data.companyId,
              mentorId: mentor.id,
            },
          },
          update: {},
          create: {
            companyId: data.companyId,
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

    // Jangan pernah kirim hash password ke client.
    const { password: _password, ...safeUser } = user;

    const result = {
      ...safeUser,

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
    // CEK DEPENDENSI
    // ============================================================

    const blockers = await getUserDeletionBlockers(id);

    if (blockers === null) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    if (blockers.length) {
      return res.status(409).json({
        error: buildDeletionBlockedMessage(blockers),
        blockers,
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