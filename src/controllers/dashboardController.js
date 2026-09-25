import prisma from '../config/db.js';

const getScope = (user, academicYearId) => {
  const scope = {
    role: 'student',
  };

  // Filter tahun ajaran
  if (academicYearId) {
    scope.academicYearId = academicYearId;
  }

  if (user.role === 'teacher') {
    scope.teacherId = user.id;
  }

  if (user.role === 'mentor') {
    scope.company = {
      mentorId: user.id,
    };
  }

  return scope;
};

const getCompanyScope = (user, academicYearId) => {
  const scope = {};

  // Filter tahun ajaran perusahaan
  if (academicYearId) {
    scope.academicYearId = academicYearId;
  }

  if (user.role === 'mentor') {
    scope.mentorId = user.id;
  }

  if (user.role === 'teacher') {
    scope.students = {
      some: {
        role: 'student',
        teacherId: user.id,
      },
    };
  }

  return scope;
};

  

export const getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    const studentWhere = getScope(req.user);
    const companyWhere = getCompanyScope(req.user);
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    if (location) companyWhere.address = { contains: location };

    const [students, companies] =
      await Promise.all([
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
            isActive: true,
            quota: true,
            academicYearId: true,
          },

          orderBy: {
            name: 'asc',
          },
        }),
      ]);

    /* =====================================================
       FILTER COMPANY YANG SESUAI TAHUN
    ===================================================== */

    const allowedCompanyIds =
      new Set(
        companies.map(
          (company) => company.id
        )
      );

    /*
     * Siswa yang:
     * - memang masuk tahun ajaran yang dipilih
     * - dan perusahaan juga masuk tahun ajaran tersebut
     */

    const scopedStudents =
      students.filter((student) => {

        if (
          academicYearId &&
          student.academicYearId !== academicYearId
        ) {
          return false;
        }

        if (!student.company) {
          return true;
        }

        return allowedCompanyIds.has(
          student.company.id
        );
      });

    /* =====================================================
       HITUNG SISWA PER PERUSAHAAN
    ===================================================== */

    const companyCounts =
      new Map(
        companies.map((company) => [
          company.id,
          {
            name: company.name,
            count: 0,
          },
        ])
      );

    /* =====================================================
       HITUNG LOKASI
    ===================================================== */

    const locationCounts = new Map();

    scopedStudents.forEach((student) => {

      if (
        !student.company ||
        !companyCounts.has(student.company.id)
      ) {
        return;
      }

      companyCounts.get(
        student.company.id
      ).count += 1;

      const address =
        student.company.address?.trim() ||
        'Lokasi tidak diisi';

      locationCounts.set(
        address,
        (locationCounts.get(address) || 0) + 1
      );
    });

    /* =====================================================
       SISWA PER PERUSAHAAN
    ===================================================== */

    const studentsPerCompany =
      [...companyCounts.values()]
        .filter(
          (item) => item.count > 0
        )
        .sort(
          (a, b) =>
            b.count - a.count
        );

    /* =====================================================
       STATUS PERUSAHAAN
    ===================================================== */

    const companyStatus =
      companies.reduce(
        (result, company) => {

          if (!company.isActive) {

            result.inactive += 1;

          } else if (
            company.quota > 0 &&
            (
              companyCounts.get(
                company.id
              )?.count || 0
            ) >= company.quota
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

    /* =====================================================
       RESULT DASAR
    ===================================================== */

    const result = {

      academicYearId,

      studentsPerCompany,

      companyStatus,

      studentLocations:
        [...locationCounts.entries()]
          .map(
            ([locationName, count]) => ({
              name: locationName,
              count,
            })
          )
          .sort(
            (a, b) =>
              b.count - a.count
          ),
    };

    /* =====================================================
       TEACHER
    ===================================================== */

    if (role === 'teacher') {

      result.studentStatus =
        scopedStudents.reduce(
          (status, student) => {

            if (!student.company) {

              status.notPlaced += 1;

            } else if (
              student.absensis.some(
                (item) =>
                  item.status === 'sakit'
              )
            ) {

              status.sick += 1;

            } else if (
              student.absensis.some(
                (item) =>
                  item.status === 'izin'
              )
            ) {

              status.permission += 1;

            } else {

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

    /* =====================================================
       MENTOR
    ===================================================== */

    if (role === 'mentor') {

      result.logbookStatus =
        scopedStudents.reduce(
          (status, student) => {

            student.logbooks.forEach(
              (logbook) => {

                if (
                  logbook.status ===
                  'approved'
                ) {

                  status.approved += 1;

                } else if (
                  logbook.status ===
                  'rejected'
                ) {

                  status.revision += 1;

                } else {

                  status.pending += 1;

                }

              }
            );

            return status;

          },
          {
            pending: 0,
            approved: 0,
            revision: 0,
          }
        );

      result.attendancePerStudent =
        scopedStudents
          .map((student) => ({
            name: student.name,

            count:
              student.absensis.filter(
                (item) =>
                  item.status ===
                  'hadir'
              ).length,
          }))
          .sort(
            (a, b) =>
              b.count - a.count
          );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json(result);

  } catch (error) {

    next(error);

  }
};