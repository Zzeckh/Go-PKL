import prisma from '../config/db.js';

/* =====================================================
   SCOPE SISWA
===================================================== */

const getScope = (user, academicYearId) => {
  const scope = {
    role: 'student',
  };

  // Filter tahun ajaran siswa
  if (academicYearId) {
    scope.academicYearId = academicYearId;
  }

  // Guru hanya melihat siswa bimbingannya
  if (user.role === 'teacher') {
    scope.teacherId = user.id;
  }

  // Mentor hanya melihat siswa dari perusahaan
  // yang menjadi tanggung jawabnya
  if (user.role === 'mentor') {
    scope.company = {
      mentorId: user.id,
    };
  }

  return scope;
};

/* =====================================================
   SCOPE PERUSAHAAN
===================================================== */

const getCompanyScope = (user) => {
  const scope = {};

  // Mentor hanya melihat perusahaan yang dibimbingnya
  if (user.role === 'mentor') {
    scope.mentorId = user.id;
  }

  // Guru hanya melihat perusahaan yang memiliki
  // siswa bimbingannya
  if (user.role === 'teacher') {
    scope.students = {
      some: {
        role: 'student',
        teacherId: user.id,
      },
    };
  }

  // Hubin dapat melihat seluruh perusahaan.
  // Filter tahun ajaran tidak diterapkan ke perusahaan
  // karena academicYearId perusahaan dapat bernilai NULL.
  return scope;
};

/* =====================================================
   DASHBOARD STATS
===================================================== */

export const getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;

    /* ================================================
       VALIDASI TAHUN AJARAN
    ================================================ */

    const rawAcademicYearId = req.query.academicYearId;

    const academicYearId = rawAcademicYearId
      ? Number(rawAcademicYearId)
      : null;

    if (
      academicYearId !== null &&
      (!Number.isInteger(academicYearId) || academicYearId <= 0)
    ) {
      return res.status(400).json({
        error: 'academicYearId tidak valid.',
      });
    }

    /* ================================================
       SCOPE DATA
    ================================================ */

    const studentWhere = getScope(
      req.user,
      academicYearId
    );

    const companyWhere = getCompanyScope(req.user);

    /* ================================================
       FILTER LOKASI
    ================================================ */

    const location =
      typeof req.query.location === 'string'
        ? req.query.location.trim()
        : '';

    if (location) {
      companyWhere.address = {
        contains: location,
      };
    }

    /* ================================================
       AMBIL DATA SISWA DAN PERUSAHAAN
    ================================================ */

    const [students, companies] = await Promise.all([
      prisma.user.findMany({
        where: studentWhere,

        select: {
          id: true,
          name: true,
          academicYearId: true,

          company: {
            select: {
              id: true,
              name: true,
              address: true,
              academicYearId: true,
            },
          },

          absensis: {
            select: {
              status: true,
            },
          },

          logbooks: {
            select: {
              status: true,
            },
          },
        },
      }),

      prisma.company.findMany({
        where: companyWhere,

        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          country: true,
          isActive: true,

          // IMPORTANT:
          // Schema Prisma sekarang menggunakan quotaCompany,
          // bukan quota.
          quotaCompany: true,

          academicYearId: true,
        },

        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    /* ================================================
       PERUSAHAAN YANG BOLEH DITAMPILKAN
    ================================================ */

    const allowedCompanyIds = new Set(
      companies.map((company) => company.id)
    );

    /* ================================================
       FILTER SISWA
    ================================================ */

    const scopedStudents = students.filter((student) => {
      // Tetap filter siswa berdasarkan tahun ajaran
      if (
        academicYearId &&
        student.academicYearId !== academicYearId
      ) {
        return false;
      }

      // Siswa yang belum memiliki perusahaan tetap
      // dihitung dalam statistik siswa pembimbingnya
      if (!student.company) {
        return true;
      }

      // Siswa dengan perusahaan hanya dihitung jika
      // perusahaannya masuk dalam scope pengguna
      return allowedCompanyIds.has(student.company.id);
    });

    /* ================================================
       SIAPKAN HITUNGAN SISWA PER PERUSAHAAN
    ================================================ */

    const companyCounts = new Map(
      companies.map((company) => [
        company.id,
        {
          name: company.name,
          count: 0,
        },
      ])
    );

    /* ================================================
       HITUNG SISWA DAN LOKASI PERUSAHAAN
    ================================================ */

    const locationCounts = new Map();

    scopedStudents.forEach((student) => {
      if (
        !student.company ||
        !companyCounts.has(student.company.id)
      ) {
        return;
      }

      companyCounts.get(student.company.id).count += 1;

      // Gunakan address sebagai nama lokasi
      const address =
        student.company.address?.trim() ||
        'Lokasi tidak diisi';

      locationCounts.set(
        address,
        (locationCounts.get(address) || 0) + 1
      );
    });

    /* ================================================
       DATA SISWA PER PERUSAHAAN
    ================================================ */

    const studentsPerCompany = [
      ...companyCounts.values(),
    ]
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    /* ================================================
       STATUS PERUSAHAAN
    ================================================ */

    const companyStatus = companies.reduce(
      (result, company) => {
        const studentCount =
          companyCounts.get(company.id)?.count || 0;

        // Perusahaan nonaktif
        if (!company.isActive) {
          result.inactive += 1;
          return result;
        }

        // Kapasitas perusahaan
        const quota = Number(
          company.quotaCompany || 0
        );

        // Jika quota > 0 dan siswa sudah mencapai quota
        if (
          quota > 0 &&
          studentCount >= quota
        ) {
          result.full += 1;
        } else {
          result.active += 1;
        }

        return result;
      },
      {
        active: 0,
        inactive: 0,
        full: 0,
      }
    );

    /* ================================================
       HASIL DASAR DASHBOARD
    ================================================ */

    const result = {
      academicYearId,

      studentsPerCompany,

      companyStatus,

      studentLocations: [
        ...locationCounts.entries(),
      ]
        .map(([locationName, count]) => ({
          name: locationName,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    };

    /* ================================================
       STATISTIK GURU PEMBIMBING
    ================================================ */

    if (role === 'teacher') {
      result.studentStatus = scopedStudents.reduce(
        (status, student) => {
          // Belum ditempatkan
          if (!student.company) {
            status.notPlaced += 1;
          }

          // Sakit
          else if (
            student.absensis.some(
              (item) => item.status === 'sakit'
            )
          ) {
            status.sick += 1;
          }

          // Izin
          else if (
            student.absensis.some(
              (item) => item.status === 'izin'
            )
          ) {
            status.permission += 1;
          }

          // Aktif
          else {
            status.active += 1;
          }

          return status;
        },
        {
          active: 0,
          permission: 0,
          sick: 0,
          notPlaced: 0,
        }
      );
    }

    /* ================================================
       STATISTIK MENTOR PERUSAHAAN
    ================================================ */

    if (role === 'mentor') {
      result.logbookStatus = scopedStudents.reduce(
        (status, student) => {
          student.logbooks.forEach((logbook) => {
            if (logbook.status === 'approved') {
              status.approved += 1;
            } else if (logbook.status === 'rejected') {
              status.revision += 1;
            } else {
              status.pending += 1;
            }
          });

          return status;
        },
        {
          pending: 0,
          approved: 0,
          revision: 0,
        }
      );

      result.attendancePerStudent = scopedStudents
        .map((student) => ({
          name: student.name,

          count: student.absensis.filter(
            (item) => item.status === 'hadir'
          ).length,
        }))
        .sort((a, b) => b.count - a.count);
    }

    /* ================================================
       KIRIM RESPONSE
    ================================================ */

    return res.json(result);
  } catch (error) {
    console.error(
      'Gagal mengambil statistik dashboard:',
      error
    );

    return next(error);
  }
};