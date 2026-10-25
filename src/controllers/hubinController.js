import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import {
  getUserDeletionBlockers,
  buildDeletionBlockedMessage,
} from '../services/userDeletionService.js';

/* =========================================================
   STATS GLOBAL
   GET /api/hubin/stats
   ========================================================= */

export const getStats = async (req, res, next) => {
  try {
    const { academicYearId } = req.query;

    const yearId = academicYearId
      ? Number(academicYearId)
      : null;

    const yearFilter =
      yearId &&
      Number.isInteger(yearId) &&
      yearId > 0
        ? { academicYearId: yearId }
        : {};

    const [
      totalClasses,
      totalStudents,
      totalTeachers,
      totalMentors,
      totalHubins,
    ] = await Promise.all([
      prisma.class.count({
        where: yearFilter,
      }),

      prisma.user.count({
        where: {
          role: 'student',
          ...yearFilter,
        },
      }),

      prisma.user.count({
        where: {
          role: 'teacher',
          ...yearFilter,
        },
      }),

      prisma.user.count({
        where: {
          role: 'mentor',
          ...yearFilter,
        },
      }),

      prisma.user.count({
        where: {
          role: 'hubin',
          ...yearFilter,
        },
      }),
    ]);

    const [
      totalAbsensi,
      totalLogbooks,
      totalPermissions,
    ] = await Promise.all([
      prisma.absensi.count({
        where: {
          user: yearFilter,
        },
      }),

      prisma.logbook.count({
        where: {
          user: yearFilter,
        },
      }),

      prisma.permission.count({
        where: {
          user: yearFilter,
        },
      }),
    ]);

    res.json({
      totalClasses,
      totalStudents,
      totalTeachers,
      totalMentors,
      totalHubins,
      totalCompanies: 0,
      totalAbsensi,
      totalLogbooks,
      totalPermissions,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CREATE STUDENT
   POST /api/hubin/students
   ========================================================= */

export const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      nis,
      classId,
      teacherId,
      companyId,
      academicYearId,
      academicYear,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        error: 'Nama siswa wajib diisi.',
      });
    }

    const cleanNis = String(nis ?? '').trim();

    if (!/^\d{4,30}$/.test(cleanNis)) {
      return res.status(400).json({
        error: 'NIS harus berupa 4-30 digit angka.',
      });
    }

    const email = `${cleanNis}@gopkl.id`;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'NIS sudah terdaftar.',
      });
    }

    const classIdNumber = Number(classId);

    if (!Number.isInteger(classIdNumber) || classIdNumber <= 0) {
      return res.status(400).json({
        error: 'Kelas wajib dipilih.',
      });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classIdNumber },
      select: {
        id: true,
        academicYearId: true,
      },
    });

    if (!classData) {
      return res.status(400).json({
        error: 'Kelas tidak ditemukan.',
      });
    }

    let yearId = classData.academicYearId ?? null;

    if (
      academicYearId !== undefined &&
      academicYearId !== null &&
      academicYearId !== ''
    ) {
      const parsedYearId = Number(academicYearId);

      if (
        !Number.isInteger(parsedYearId) ||
        parsedYearId <= 0
      ) {
        return res.status(400).json({
          error: 'academicYearId tidak valid.',
        });
      }

      if (
        classData.academicYearId &&
        classData.academicYearId !== parsedYearId
      ) {
        return res.status(400).json({
          error: 'Kelas tidak sesuai dengan tahun ajaran.',
        });
      }

      yearId = parsedYearId;
    }

    let resolvedYear = null;

    if (yearId) {
      resolvedYear = await prisma.academicYear.findUnique({
        where: { id: yearId },
        select: { id: true, name: true },
      });

      if (!resolvedYear) {
        return res.status(400).json({
          error: 'Tahun ajaran tidak ditemukan.',
        });
      }
    }

    let teacherIdValue = null;

    if (
      teacherId !== undefined &&
      teacherId !== null &&
      teacherId !== ''
    ) {
      const parsedTeacherId = Number(teacherId);

      if (
        !Number.isInteger(parsedTeacherId) ||
        parsedTeacherId <= 0
      ) {
        return res.status(400).json({
          error: 'teacherId tidak valid.',
        });
      }

      const teacher = await prisma.user.findUnique({
        where: { id: parsedTeacherId },
        select: { id: true, role: true },
      });

      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({
          error: 'Guru pembimbing tidak valid.',
        });
      }

      teacherIdValue = teacher.id;
    }

    let companyIdValue = null;

    if (
      companyId !== undefined &&
      companyId !== null &&
      companyId !== ''
    ) {
      const parsedCompanyId = Number(companyId);

      if (
        !Number.isInteger(parsedCompanyId) ||
        parsedCompanyId <= 0
      ) {
        return res.status(400).json({
          error: 'companyId tidak valid.',
        });
      }

      const company = await prisma.company.findUnique({
        where: { id: parsedCompanyId },
        select: { id: true },
      });

      if (!company) {
        return res.status(400).json({
          error: 'Perusahaan tidak ditemukan.',
        });
      }

      companyIdValue = company.id;
    }

    const hashedPassword = await bcrypt.hash('gopkl123', 10);

    const student = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email,
        password: hashedPassword,
        role: 'student',
        isActive: true,
        classId: classData.id,
        teacherId: teacherIdValue,
        companyId: companyIdValue,
        academicYearId: yearId,
        academicYear:
          resolvedYear?.name ??
          (academicYear !== undefined &&
          academicYear !== null &&
          String(academicYear).trim() !== ''
            ? String(academicYear).trim()
            : null),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        classId: true,
        teacherId: true,
        companyId: true,
        academicYearId: true,
        academicYear: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Siswa berhasil ditambahkan.',
      data: student,
      initialPassword: 'gopkl123',
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'NIS sudah terdaftar.',
      });
    }

    next(error);
  }
};

/* =========================================================
   GET CLASSES
   GET /api/hubin/classes
   Filter berdasarkan Tahun Ajaran
   ========================================================= */

export const getClasses = async (req, res, next) => {
  try {
    const { academicYearId } = req.query;

    const where = {};

    if (academicYearId) {
      const yearId = Number(academicYearId);

      if (
        !Number.isInteger(yearId) ||
        yearId <= 0
      ) {
        return res.status(400).json({
          error: 'academicYearId tidak valid.',
        });
      }

      where.academicYearId = yearId;
    }

    const classes =
      await prisma.class.findMany({
        where,

        include: {
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },

          _count: {
            select: {
              users: true,
            },
          },
        },

        orderBy: {
          id: 'asc',
        },
      });

    const mapped = classes.map((c) => ({
      id: c.id,
      name: c.name,
      major: c.major || '-',

      academicYearId:
        c.academicYearId,

      academicYear:
        c.academicYear?.name || '-',

      totalStudents:
        c._count.users,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   CREATE CLASS
   POST /api/hubin/classes
   ========================================================= */

export const createClass = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      major,
      academicYearId,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Nama kelas wajib diisi.',
      });
    }

    if (!academicYearId) {
      return res.status(400).json({
        error: 'Tahun Ajaran wajib dipilih.',
      });
    }

    const yearId =
      Number(academicYearId);

    if (
      !Number.isInteger(yearId) ||
      yearId <= 0
    ) {
      return res.status(400).json({
        error:
          'academicYearId tidak valid.',
      });
    }

    const academicYear =
      await prisma.academicYear.findUnique({
        where: {
          id: yearId,
        },
      });

    if (!academicYear) {
      return res.status(404).json({
        error:
          'Tahun Ajaran tidak ditemukan.',
      });
    }

    const existing =
      await prisma.class.findFirst({
        where: {
          name,
          academicYearId: yearId,
        },
      });

    if (existing) {
      return res.status(409).json({
        error:
          'Nama kelas sudah terdaftar pada Tahun Ajaran tersebut.',
      });
    }

    const created =
      await prisma.class.create({
        data: {
          name,
          major: major || null,
          academicYearId: yearId,
        },

        include: {
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    res.status(201).json({
      id: created.id,
      name: created.name,
      major: created.major || '-',

      academicYearId:
        created.academicYearId,

      academicYear:
        created.academicYear?.name ||
        '-',
    });
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   DELETE CLASS
   DELETE /api/hubin/classes/:id
   ========================================================= */

export const deleteClass = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error:
          'ID kelas tidak valid.',
      });
    }

    const usersCount =
      await prisma.user.count({
        where: {
          classId: id,
        },
      });

    if (usersCount > 0) {
      return res.status(400).json({
        error:
          `Kelas memiliki ${usersCount} siswa. Pindahkan siswa terlebih dahulu.`,
      });
    }

    const foundClass =
      await prisma.class.findUnique({
        where: {
          id,
        },
      });

    if (!foundClass) {
      return res.status(404).json({
        error:
          'Kelas tidak ditemukan.',
      });
    }

    await prisma.class.delete({
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


/* =========================================================
   GET CLASS STUDENTS
   GET /api/hubin/classes/:id/students
   ========================================================= */

export const getClassStudents = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error:
          'ID kelas tidak valid.',
      });
    }

    const foundClass =
      await prisma.class.findUnique({
        where: {
          id,
        },

        include: {
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },

          users: {
            where: {
              role: 'student',
            },

            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },

              teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },

              _count: {
                select: {
                  absensis: true,
                  logbooks: true,
                },
              },
            },

            orderBy: {
              id: 'asc',
            },
          },
        },
      });

    if (!foundClass) {
      return res.status(404).json({
        error:
          'Kelas tidak ditemukan.',
      });
    }

    const students =
      foundClass.users.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        isActive: s.isActive,

        academicYear:
          s.academicYear || '-',

        perusahaan:
          s.company?.name || '-',

        guruPembimbing:
          s.teacher?.name || '-',

        kehadiran:
          s._count.absensis,

        logbooks:
          s._count.logbooks,
      }));

    res.json({
      id: foundClass.id,
      name: foundClass.name,
      major: foundClass.major || '-',

      academicYearId:
        foundClass.academicYearId,

      academicYear:
        foundClass.academicYear?.name ||
        '-',

      students,
    });
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   GET USERS
   GET /api/hubin/users
   ========================================================= */

export const getUsers = async (
  req,
  res,
  next
) => {
  try {
    const {
      role,
      search,
      academicYearId,
    } = req.query;

    const where = {};

    /* FILTER ROLE */

    if (
      role &&
      role !== 'all'
    ) {
      where.role = role;
    }

    /* FILTER TAHUN AJARAN */

    if (academicYearId) {
      const yearId =
        Number(academicYearId);

      if (
        !Number.isInteger(yearId) ||
        yearId <= 0
      ) {
        return res.status(400).json({
          error:
            'academicYearId tidak valid.',
        });
      }

      where.academicYearId =
        yearId;
    }

    /* SEARCH */

   if (search?.trim()) {
  const keyword = search.trim();

  where.OR = [
    {
      name: {
        contains: keyword,
      },
    },
    {
      email: {
        contains: keyword,
      },
    },
  ];
}
    const users =
      await prisma.user.findMany({
        where,

        include: {
          class: {
            select: {
              id: true,
              name: true,
              major: true,
            },
          },

          academicYearRef: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          id: 'desc',
        },

        take: 200,
      });

    const mapped =
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,

        /* DATA NONAKTIF */
        inactiveCategory:
          u.inactiveCategory || null,

        inactiveReason:
          u.inactiveReason || null,

        inactiveAt:
          u.inactiveAt || null,

        class:
          u.class?.name || '-',

        classId:
          u.class?.id || null,

        major:
          u.class?.major || '-',

        academicYear:
          u.academicYearRef?.name ||
          u.academicYear ||
          '-',

        academicYearId:
          u.academicYearId,
      }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   TOGGLE USER
   PATCH /api/hubin/users/:id/toggle
   ========================================================= */

export const toggleUser = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error:
          'ID user tidak valid.',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return res.status(404).json({
        error:
          'User tidak ditemukan.',
      });
    }

    if (user.id === req.user.id) {
      return res.status(403).json({
        error:
          'Tidak dapat menonaktifkan akun sendiri.',
      });
    }

    const updated =
      await prisma.user.update({
        where: {
          id,
        },

        data: {
          isActive:
            !user.isActive,
        },
      });

    res.json({
      id: updated.id,
      isActive:
        updated.isActive,
    });
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   DELETE USER
   DELETE /api/hubin/users/:id
   ========================================================= */

export const deleteUser = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error:
          'ID user tidak valid.',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return res.status(404).json({
        error:
          'User tidak ditemukan.',
      });
    }

    if (user.id === req.user.id) {
      return res.status(403).json({
        error:
          'Tidak dapat menghapus akun sendiri.',
      });
    }

    // ============================================================
    // CEK DEPENDENSI
    // ------------------------------------------------------------
    // Hard delete hanya aman untuk akun yang belum punya data.
    // Akun dengan riwayat PKL harus dinonaktifkan agar data tidak
    // hilang dan relasi foreign key tidak error.
    // ============================================================

    const blockers = await getUserDeletionBlockers(id);

    if (blockers === null) {
      return res.status(404).json({
        error:
          'User tidak ditemukan.',
      });
    }

    if (blockers.length) {
      return res.status(409).json({
        error: buildDeletionBlockedMessage(blockers),
        blockers,
      });
    }

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


/* =========================================================
   UPDATE USER ROLE
   PATCH /api/hubin/users/:id/role
   ========================================================= */

export const updateUserRole = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    const { role } = req.body;

    const allowed = [
      'student',
      'teacher',
      'hubin',
    ];

    if (!allowed.includes(role)) {
      return res.status(400).json({
        error:
          'Role tidak valid.',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return res.status(404).json({
        error:
          'User tidak ditemukan.',
      });
    }

    if (user.id === req.user.id) {
      return res.status(403).json({
        error:
          'Tidak dapat mengubah role akun sendiri.',
      });
    }

    const updated =
      await prisma.user.update({
        where: {
          id,
        },

        data: {
          role,
        },
      });

    res.json({
      id: updated.id,
      role: updated.role,
    });
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   RESET PASSWORD
   POST /api/hubin/users/:id/reset-password
   ========================================================= */

export const resetPassword = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error:
          'ID user tidak valid.',
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return res.status(404).json({
        error:
          'User tidak ditemukan.',
      });
    }

    if (user.id === req.user.id) {
      return res.status(403).json({
        error:
          'Tidak dapat mereset password akun sendiri.',
      });
    }

    const newPassword =
      Math.random()
        .toString(36)
        .slice(-8);

    const hashed =
      await bcrypt.hash(
        newPassword,
        10
      );

    await prisma.user.update({
      where: {
        id,
      },

      data: {
        password: hashed,
      },
    });

    res.json({
      id: user.id,
      name: user.name,
      newPassword,
    });
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   GET SISWA UNTUK ALUMNI / KELUAR SEKOLAH
   GET /api/hubin/deactivation-students

   Query:
   type=alumni
   type=keluar_sekolah

   Bisa menggunakan:
   search
   classId
   academicYearId
   ========================================================= */

export const getStudentsForDeactivation = async (
  req,
  res,
  next
) => {
  try {
    const {
      type,
      search,
      classId,
      academicYearId,
    } = req.query;

    /* VALIDASI TYPE */

    if (
      ![
        'alumni',
        'keluar_sekolah',
      ].includes(type)
    ) {
      return res.status(400).json({
        error:
          'Tipe harus alumni atau keluar_sekolah.',
      });
    }

    /*
     * HANYA SISWA AKTIF
     *
     * Guru, mentor, dan Hubin tidak akan
     * masuk.
     */

    const where = {
      role: 'student',
      isActive: true,
    };

    /* FILTER TAHUN AJARAN */

    if (academicYearId) {
      const yearId =
        Number(academicYearId);

      if (
        !Number.isInteger(yearId) ||
        yearId <= 0
      ) {
        return res.status(400).json({
          error:
            'academicYearId tidak valid.',
        });
      }

      where.academicYearId =
        yearId;
    }

    /* FILTER KELAS */

    if (
      classId &&
      classId !== 'all'
    ) {
      const id =
        Number(classId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          error:
            'classId tidak valid.',
        });
      }

      where.classId = id;
    }

    /* SEARCH NAMA / EMAIL */

    if (search?.trim()) {
      const keyword =
        search.trim();

      where.OR = [
        {
          name: {
            contains:
              keyword,
          },
        },

        {
          email: {
            contains:
              keyword,
          },
        },
      ];
    }

    /* AMBIL DATA */

    const students =
      await prisma.user.findMany({
        where,

        select: {
          id: true,
          name: true,
          email: true,
          academicYearId: true,

          class: {
            select: {
              id: true,
              name: true,
              major: true,
            },
          },

          academicYearRef: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          name: 'asc',
        },
      });

    /* FORMAT RESPONSE */

    const result =
      students.map(
        (student) => ({
          id: student.id,

          name: student.name,

          email: student.email,

          classId:
            student.class?.id ||
            null,

          class:
            student.class?.name ||
            '-',

          major:
            student.class?.major ||
            '-',

          academicYearId:
            student.academicYearId,

          academicYear:
            student
              .academicYearRef
              ?.name || '-',
        })
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   NONAKTIFKAN BANYAK SISWA
   POST /api/hubin/deactivate-students

   Body:

   {
     "userIds": [1, 2, 3],
     "category": "Alumni",
     "reason": "Lulus"
   }

   atau

   {
     "userIds": [1, 2, 3],
     "category": "Keluar Sekolah",
     "reason": "Mengundurkan diri"
   }
   ========================================================= */

export const deactivateStudents = async (
  req,
  res,
  next
) => {
  try {
    const {
      userIds,
      category,
      reason,
    } = req.body;

    /* VALIDASI USER IDS */

    if (
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return res.status(400).json({
        error:
          'Minimal pilih satu siswa.',
      });
    }

    /* VALIDASI KATEGORI */

    if (
      ![
        'Alumni',
        'Keluar Sekolah',
      ].includes(category)
    ) {
      return res.status(400).json({
        error:
          'Kategori tidak valid.',
      });
    }

    /* KONVERSI ID */

    const ids = userIds
      .map(Number)
      .filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0
      );

    if (ids.length === 0) {
      return res.status(400).json({
        error:
          'ID siswa tidak valid.',
      });
    }

    /*
     * CARI USER YANG:
     * - ID-nya dipilih
     * - role student
     * - masih aktif
     */

    const students =
      await prisma.user.findMany({
        where: {
          id: {
            in: ids,
          },

          role: 'student',

          isActive: true,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (students.length === 0) {
      return res.status(404).json({
        error:
          'Tidak ada siswa aktif yang ditemukan.',
      });
    }

    /* NONAKTIFKAN */

    await prisma.user.updateMany({
      where: {
        id: {
          in: students.map(
            (student) =>
              student.id
          ),
        },

        role: 'student',

        isActive: true,
      },

      data: {
        isActive: false,

        inactiveCategory:
          category,

        inactiveReason:
          reason?.trim() ||
          category,

        inactiveAt:
          new Date(),
      },
    });

    /* RESPONSE */

    res.json({
      success: true,

      count:
        students.length,

      category,

      message:
        `${students.length} siswa berhasil ` +
        `dinonaktifkan sebagai ${category}.`,
    });
  } catch (error) {
    next(error);
  }
};


/* =========================================================
   AKTIFKAN KEMBALI USER
   PATCH /api/hubin/users/:id/activate

   Data riwayat tidak dihapus.
   Hanya status aktif yang dikembalikan.
   ========================================================= */

export const activateUser = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error:
          'ID user tidak valid.',
      });
    }

    /* CARI USER */

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      return res.status(404).json({
        error:
          'User tidak ditemukan.',
      });
    }

    /* Cegah Hubin mengubah status akunnya sendiri */

    if (user.id === req.user.id) {
      return res.status(403).json({
        error:
          'Tidak dapat mengubah status akun sendiri.',
      });
    }

    /* AKTIFKAN KEMBALI */

    const updated =
      await prisma.user.update({
        where: {
          id,
        },

        data: {
          isActive: true,

          inactiveCategory:
            null,

          inactiveReason:
            null,

          inactiveAt:
            null,
        },
      });

    res.json({
      success: true,

      id: updated.id,

      isActive:
        updated.isActive,

      message:
        'User berhasil diaktifkan kembali.',
    });
  } catch (error) {
    next(error);
  }
};