import prisma from '../config/db.js';
import {
  formatDateID,
  formatTimeID,
  labelStatus,
  safeFilename,
  streamPdfReport,
} from '../utils/pdfReport.js';

const REPORT_TYPES = new Set([
  'mentor',
  'teacher',
  'student',
  'class',
  'company',
]);

const ABSENSI_STATUS = new Set([
  'hadir',
  'izin',
  'sakit',
  'alpha',
]);

/* ================================================================
   DATE RANGE
   ================================================================ */

const dateRange = (query) => {
  const range = {};

  if (query.startDate) {
    const start = new Date(
      `${query.startDate}T00:00:00`
    );

    if (!Number.isNaN(start.getTime())) {
      range.gte = start;
    }
  }

  if (query.endDate) {
    const end = new Date(
      `${query.endDate}T23:59:59.999`
    );

    if (!Number.isNaN(end.getTime())) {
      range.lte = end;
    }
  }

  return Object.keys(range).length
    ? range
    : undefined;
};

/* ================================================================
   BUILD STUDENT SCOPE
   ================================================================ */

const buildStudentScope = (req, query) => {
  const scope = {
    role: 'student',
  };

  /* ============================================================
     ROLE ACCESS
  ============================================================ */

  if (req.user.role === 'student') {
    scope.id = req.user.id;
  }

  if (req.user.role === 'teacher') {
    scope.teacherId = req.user.id;
  }

  if (req.user.role === 'mentor') {
    scope.company = {
      mentorId: req.user.id,
    };
  }

  /* ============================================================
     STUDENT FILTER
  ============================================================ */

  if (
    req.user.role !== 'student' &&
    query.studentId
  ) {
    const studentId = Number(
      query.studentId
    );

    if (
      Number.isInteger(studentId) &&
      studentId > 0
    ) {
      scope.id = studentId;
    }
  }

  /* ============================================================
     CLASS FILTER
  ============================================================ */

  if (query.classId) {
    const classId = Number(
      query.classId
    );

    if (
      Number.isInteger(classId) &&
      classId > 0
    ) {
      scope.classId = classId;
    }
  }

  /* ============================================================
     COMPANY FILTER
  ============================================================ */

  if (query.companyId) {
    const companyId = Number(
      query.companyId
    );

    if (
      Number.isInteger(companyId) &&
      companyId > 0
    ) {
      scope.company = {
        ...(scope.company || {}),
        id: companyId,
      };
    }
  }

  /* ============================================================
     MENTOR FILTER
  ============================================================ */

  if (query.mentorId) {
    const mentorId = Number(
      query.mentorId
    );

    if (
      Number.isInteger(mentorId) &&
      mentorId > 0
    ) {
      scope.company = {
        ...(scope.company || {}),
        mentorId,
      };
    }
  }

  /* ============================================================
     ACADEMIC YEAR FILTER
     ============================================================ */

  if (query.academicYearId) {
    const academicYearId = Number(
      query.academicYearId
    );

    if (
      Number.isInteger(academicYearId) &&
      academicYearId > 0
    ) {
      scope.academicYearId =
        academicYearId;
    }
  }

  return scope;
};

/* ================================================================
   VALIDATE REQUESTED STUDENT
   ================================================================ */

const validateRequestedStudent = async (
  req,
  query
) => {
  if (!query.studentId) return;

  const target =
    await prisma.user.findUnique({
      where: {
        id: Number(
          query.studentId
        ),
      },

      select: {
        id: true,
        role: true,
        teacherId: true,

        company: {
          select: {
            mentorId: true,
          },
        },
      },
    });

  const allowed =
    target &&
    target.role === 'student' &&
    (
      req.user.role === 'super_admin' ||
      req.user.role === 'hubin' ||
      (
        req.user.role === 'student' &&
        target.id === req.user.id
      ) ||
      (
        req.user.role === 'teacher' &&
        target.teacherId === req.user.id
      ) ||
      (
        req.user.role === 'mentor' &&
        target.company?.mentorId ===
          req.user.id
      )
    );

  if (!allowed) {
    const error = new Error(
      'Anda tidak berhak melihat histori siswa ini.'
    );

    error.status = 403;

    throw error;
  }
};

/* ================================================================
   FINAL ATTENDANCE
   ================================================================ */

const finalAttendance = (
  student
) => {
  const records = new Map();

  student.absensis.forEach(
    (item) => {
      records.set(
        formatDateID(item.date),
        {
          date:
            formatDateID(
              item.date
            ),

          status:
            item.status,

          reason: '-',

          checkIn:
            formatTimeID(
              item.checkInTime
            ),
        }
      );
    }
  );

  student.permissions.forEach(
    (item) => {
      const key =
        formatDateID(
          item.date
        );

      if (!records.has(key)) {
        records.set(
          key,
          {
            date: key,

            status:
              item.type,

            reason:
              item.reason || '-',

            checkIn: '-',
          }
        );
      }
    }
  );

  return [
    ...records.values(),
  ];
};

/* ================================================================
   SUMMARY
   ================================================================ */

const summary = (
  attendance
) =>
  attendance.reduce(
    (result, item) => {
      if (
        item.status === 'hadir'
      ) {
        result.hadir += 1;
      }

      if (
        item.status === 'izin'
      ) {
        result.izin += 1;
      }

      if (
        item.status === 'sakit'
      ) {
        result.sakit += 1;
      }

      if (
        item.status === 'alpha'
      ) {
        result.alpha += 1;
      }

      result.total += 1;

      return result;
    },
    {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      total: 0,
    }
  );

/* ================================================================
   GET ACADEMIC YEAR NAME
   ================================================================ */

const getAcademicYearName = async (
  academicYearId
) => {
  if (!academicYearId) {
    return null;
  }

  const id = Number(
    academicYearId
  );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  const academicYear =
    await prisma.academicYear.findUnique({
      where: {
        id,
      },

      select: {
        name: true,
      },
    });

  return academicYear?.name || null;
};

/* ================================================================
   GET REPORT DATA
   ================================================================ */

export const getReportData = async (
  req
) => {
  const query = req.query;

  const requestedType =
    REPORT_TYPES.has(
      req.query.reportType
    )
      ? req.query.reportType
      : 'student';

  /* ============================================================
     VALIDATE STUDENT
  ============================================================ */

  await validateRequestedStudent(
    req,
    query
  );

  /* ============================================================
     STUDENT SCOPE
  ============================================================ */

  const where =
    buildStudentScope(
      req,
      req.query
    );

  /* ============================================================
     DATE RANGE
  ============================================================ */

  const range =
    dateRange(req.query);

  const attendanceFilter =
    range
      ? {
          date: range,
        }
      : {};

  /* ============================================================
     ABSENSI STATUS
  ============================================================ */

  if (
    query.status &&
    ABSENSI_STATUS.has(
      query.status
    )
  ) {
    attendanceFilter.status =
      query.status;
  }

  /* ============================================================
     PERMISSION FILTER
  ============================================================ */

  const permissionFilter = {
    ...(range
      ? {
          date: range,
        }
      : {}),

    status: 'approved',
  };

  if (
    query.status === 'izin' ||
    query.status === 'sakit'
  ) {
    permissionFilter.type =
      query.status;
  }

  if (
    query.status === 'hadir' ||
    query.status === 'alpha'
  ) {
    permissionFilter.id = -1;
  }

  /* ============================================================
     GET STUDENTS
  ============================================================ */

  const students =
    await prisma.user.findMany({
      where,

      orderBy: {
        name: 'asc',
      },

      include: {
        class: true,

        teacher: true,

        company: {
          include: {
            mentor: true,
          },
        },

        absensis: {
          where:
            attendanceFilter,

          orderBy: {
            date: 'asc',
          },
        },

        permissions: {
          where:
            permissionFilter,

          orderBy: {
            date: 'asc',
          },
        },
      },
    });

  /* ============================================================
     ROWS
  ============================================================ */

  const rows =
    students.map(
      (student) => {
        const attendance =
          finalAttendance(
            student
          );

        const counts =
          summary(
            attendance
          );

        return {
          id: student.id,

          username:
            student.email,

          name:
            student.name,

          className:
            student.class?.name ||
            '-',

          major:
            student.class?.major ||
            '-',

          companyName:
            student.company?.name ||
            '-',

          companyAddress:
            student.company?.address ||
            '-',

          companyPhone:
            student.company?.phone ||
            '-',

          companyCategory:
            student.company?.category ||
            '-',

          mentorName:
            student.company?.mentor
              ?.name ||
            '-',

          teacherName:
            student.teacher?.name ||
            '-',

          quota:
            student.company?.quota ??
            null,

          isActive:
            student.company?.isActive ??
            null,

          /* Tahun ajaran siswa */
          academicYear:
            student.academicYear ||
            '-',

          academicYearId:
            student.academicYearId ??
            null,

          ...counts,

          percentage:
            counts.total
              ? Number(
                  (
                    (counts.hadir /
                      counts.total) *
                    100
                  ).toFixed(1)
                )
              : 0,

          attendance,
        };
      }
    );

  /* ============================================================
     TOTALS
  ============================================================ */

  const totals =
    rows.reduce(
      (result, row) => {
        result.hadir +=
          row.hadir;

        result.izin +=
          row.izin;

        result.sakit +=
          row.sakit;

        result.alpha +=
          row.alpha;

        result.total +=
          row.total;

        return result;
      },
      {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        total: 0,
      }
    );

  /* ============================================================
     FIRST DATA
  ============================================================ */

  const first =
    rows[0];

  /* ============================================================
     ACADEMIC YEAR
  ============================================================ */

  const academicYearName =
    await getAcademicYearName(
      query.academicYearId
    );

  /* ============================================================
     INFO
  ============================================================ */

  const info =
    requestedType === 'student' &&
    first
      ? {
          nama:
            first.name,

          nis:
            first.username,

          kelas:
            first.className,

          jurusan:
            first.major,

          perusahaan:
            first.companyName,

          alamat:
            first.companyAddress,

          mentor:
            first.mentorName,

          guru:
            first.teacherName,

          tahunAjaran:
            academicYearName ||
            first.academicYear ||
            '-',
        }
      : requestedType === 'company' &&
        first
      ? {
          perusahaan:
            first.companyName,

          alamat:
            first.companyAddress,

          telepon:
            first.companyPhone,

          kategori:
            first.companyCategory,

          mentor:
            first.mentorName,

          kuota:
            first.quota ??
            '-',

          status:
            first.isActive
              ? 'Aktif'
              : 'Tidak Aktif',

          tahunAjaran:
            academicYearName ||
            first.academicYear ||
            '-',
        }
      : requestedType === 'class' &&
        first
      ? {
          kelas:
            first.className,

          jurusan:
            first.major,

          totalSiswa:
            rows.length,

          totalPerusahaan:
            new Set(
              rows
                .map(
                  (row) =>
                    row.companyName
                )
                .filter(
                  (name) =>
                    name !== '-'
                )
            ).size,

          tahunAjaran:
            academicYearName ||
            first.academicYear ||
            '-',
        }
      : requestedType === 'mentor'
      ? {
          mentor:
            first?.mentorName ||
            '-',

          perusahaan:
            first?.companyName ||
            '-',

          alamat:
            first?.companyAddress ||
            '-',

          totalSiswa:
            rows.length,

          kuota:
            first?.quota ??
            '-',

          tahunAjaran:
            academicYearName ||
            first?.academicYear ||
            '-',
        }
      : {
          guru:
            first?.teacherName ||
            '-',

          totalSiswa:
            rows.length,

          totalKelas:
            new Set(
              rows.map(
                (row) =>
                  row.className
              )
            ).size,

          totalPerusahaan:
            new Set(
              rows
                .map(
                  (row) =>
                    row.companyName
                )
                .filter(
                  (name) =>
                    name !== '-'
                )
            ).size,

          tahunAjaran:
            academicYearName ||
            first?.academicYear ||
            '-',
        };

  /* ============================================================
     RETURN
  ============================================================ */

  return {
    reportType:
      requestedType,

    title:
      academicYearName
        ? `Laporan ${
            requestedType
              .charAt(0)
              .toUpperCase() +
            requestedType.slice(
              1
            )
          } - ${academicYearName}`
        : `Laporan ${
            requestedType
              .charAt(0)
              .toUpperCase() +
            requestedType.slice(
              1
            )
          }`,

    academicYearId:
      query.academicYearId
        ? Number(
            query.academicYearId
          )
        : null,

    academicYear:
      academicYearName,

    period:
      req.query.startDate ||
      req.query.endDate
        ? `${
            req.query.startDate ||
            '...'
          } - ${
            req.query.endDate ||
            '...'
          }`
        : 'Seluruh Periode',

    info,

    summary: {
      totalStudents:
        rows.length,

      ...totals,
    },

    rows,
  };
};

/* ================================================================
   PREVIEW REPORT
   ================================================================ */

export const previewReport = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await getReportData(
        req
      );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/* ================================================================
   EXPORT REPORT PREVIEW PDF
   ================================================================ */

export const exportReportPreviewPdf =
  async (
    req,
    res
  ) => {
    try {
      const data =
        await getReportData(
          req
        );

      if (!data.rows.length) {
        return res
          .status(404)
          .json({
            error:
              'Belum ada data untuk ditampilkan.',
          });
      }

      /* ========================================================
         PDF ROWS
      ======================================================== */

      const rows =
        data.rows.flatMap(
          (student) =>
            student.attendance
              .length
              ? student.attendance.map(
                  (item) => ({
                    name:
                      student.name,

                    username:
                      student.username,

                    className:
                      student.className,

                    companyName:
                      student.companyName,

                    date:
                      item.date,

                    status:
                      labelStatus(
                        item.status
                      ),

                    checkIn:
                      item.checkIn,

                    reason:
                      item.reason,
                  })
                )
              : [
                  {
                    name:
                      student.name,

                    username:
                      student.username,

                    className:
                      student.className,

                    companyName:
                      student.companyName,

                    date: '-',

                    status: '-',

                    checkIn: '-',

                    reason: '-',
                  },
                ]
        );

      /* ========================================================
         COLUMNS
      ======================================================== */

      const columns = [
        {
          key: 'name',
          label: 'Nama Siswa',
          width: 82,
        },

        {
          key: 'username',
          label: 'NIS / Username',
          width: 72,
        },

        {
          key: 'className',
          label: 'Kelas',
          width: 42,
        },

        {
          key: 'companyName',
          label: 'Perusahaan',
          width: 75,
        },

        {
          key: 'date',
          label: 'Tanggal',
          width: 58,
        },

        {
          key: 'status',
          label: 'Status',
          width: 42,
        },

        {
          key: 'checkIn',
          label: 'Check In',
          width: 42,
        },

        {
          key: 'reason',
          label: 'Keterangan',
          width: 80,
        },
      ];

      /* ========================================================
         FILENAME
      ======================================================== */

      const filename =
        `Laporan_${safeFilename(
          data.title
        )}.pdf`;

      /* ========================================================
         META
      ======================================================== */

      const metaLines = [
        [
          'Tahun Ajaran',
          data.academicYear ||
            'Semua Tahun Ajaran',
        ],

        [
          'Periode',
          data.period,
        ],

        [
          'Total Siswa',
          `${data.summary.totalStudents}`,
        ],

        [
          'Hadir',
          `${data.summary.hadir}`,
        ],

        [
          'Izin',
          `${data.summary.izin}`,
        ],

        [
          'Sakit',
          `${data.summary.sakit}`,
        ],

        [
          'Alpha',
          `${data.summary.alpha}`,
        ],
      ];

      /* ========================================================
         PDF
      ======================================================== */

      streamPdfReport(
        res,
        filename,
        {
          title:
            data.title.toUpperCase(),

          subtitle:
            'GO PKL - Rekap laporan database',

          metaLines,

          columns,

          rows,

          emptyMessage:
            'Belum ada data untuk ditampilkan.',
        }
      );
    } catch (error) {
      console.error(
        'exportReportPreviewPdf error:',
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          error:
            'Gagal membuat laporan PDF.',
        });
      }
    }
  };