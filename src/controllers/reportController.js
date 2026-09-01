import prisma from '../config/db.js';
import { streamPdfReport, labelStatus, formatDateID, formatTimeID, safeFilename } from '../utils/pdfReport.js';

const VALID_ABSENSI_STATUS = ['hadir', 'izin', 'sakit', 'alpha'];
const VALID_LOGBOOK_STATUS = ['pending', 'approved', 'rejected'];

/**
 * Bangun kondisi filter pada model User berdasarkan role yang sedang login,
 * digabung dengan filter opsional dari query string (studentId, classId, companyId).
 * - student  : hanya dirinya sendiri, filter lain diabaikan.
 * - teacher  : hanya siswa bimbingannya (User.teacherId).
 * - mentor   : hanya siswa di perusahaan yang dia jadi mentor-nya (User.company.mentorId).
 * - hubin / super_admin : tanpa batasan.
 *
 * nested = true  → hasil dibungkus { user: {...} }  (dipakai untuk query Absensi/Logbook)
 * nested = false → hasil langsung field User          (dipakai untuk query User/PKL)
 */
function buildUserScope(req, query, { nested = false } = {}) {
  if (req.user.role === 'student') {
    const scope = { id: req.user.id };
    return nested ? { user: scope } : scope;
  }

  const scope = {};
  if (req.user.role === 'teacher') {
    scope.teacherId = req.user.id;
  }
  if (req.user.role === 'mentor') {
    scope.company = { mentorId: req.user.id };
  }

  if (query.studentId) scope.id = Number(query.studentId);
  if (query.classId) scope.classId = Number(query.classId);
  if (query.companyId) {
    scope.company = { ...(scope.company || {}), id: Number(query.companyId) };
  }

  return nested ? { user: scope } : scope;
}

function buildDateWhere(query, field = 'date') {
  const range = {};
  if (query.startDate) {
    const d = new Date(query.startDate);
    if (!isNaN(d.getTime())) range.gte = d;
  }
  if (query.endDate) {
    const d = new Date(query.endDate);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
  }
  return Object.keys(range).length ? { [field]: range } : {};
}

function studentIdentity(user) {
  return {
    name: user?.name || '-',
    username: user?.email || '-',
    className: user?.class?.name || '-',
    companyName: user?.company?.name || '-',
    teacherName: user?.teacher?.name || '-',
    mentorName: user?.company?.mentor?.name || '-',
  };
}

/* ================================================================
   1. GET /api/reports/absensi/pdf
   ================================================================ */
export const exportAbsensiPdf = async (req, res) => {
  try {
    const where = {
      ...buildUserScope(req, req.query, { nested: true }),
      ...buildDateWhere(req.query, 'date'),
    };
    if (req.query.status && VALID_ABSENSI_STATUS.includes(req.query.status)) {
      where.status = req.query.status;
    }

    const data = await prisma.absensi.findMany({
      where,
      include: {
        user: {
          include: { class: true, teacher: true, company: { include: { mentor: true } } },
        },
      },
      orderBy: [{ date: 'desc' }, { userId: 'asc' }],
    });

    if (!data.length) {
      return res.status(404).json({ error: 'Tidak ada data yang dapat diexport.' });
    }

    const rows = data.map((a, idx) => {
      const id = studentIdentity(a.user);
      return {
        no: idx + 1,
        name: id.name,
        username: id.username,
        className: id.className,
        companyName: id.companyName,
        date: formatDateID(a.date),
        checkIn: formatTimeID(a.checkInTime),
        status: labelStatus(a.status),
        location: a.latitude != null && a.longitude != null
          ? `${a.latitude.toFixed(5)}, ${a.longitude.toFixed(5)}`
          : '-',
      };
    });

    const columns = [
      { key: 'no', label: 'No', width: 20, align: 'center' },
      { key: 'name', label: 'Nama Siswa', width: 80 },
      { key: 'username', label: 'NIS / Username', width: 76 },
      { key: 'className', label: 'Kelas', width: 40 },
      { key: 'companyName', label: 'Perusahaan', width: 76 },
      { key: 'date', label: 'Tanggal', width: 60 },
      { key: 'checkIn', label: 'Jam Check In', width: 40 },
      { key: 'status', label: 'Status', width: 44 },
      { key: 'location', label: 'Lokasi GPS', width: 60 },
    ];

    const period = req.query.startDate || req.query.endDate
      ? `${req.query.startDate ? formatDateID(req.query.startDate) : '...'} — ${req.query.endDate ? formatDateID(req.query.endDate) : '...'}`
      : 'Seluruh Periode';

    let filename = 'laporan-absensi.pdf';
    const sameStudent = req.query.studentId && data.every((a) => a.userId === data[0].userId);
    if (sameStudent) {
      filename = `laporan-absensi-${safeFilename(data[0].user.name)}.pdf`;
    }

    streamPdfReport(res, filename, {
      title: 'LAPORAN ABSENSI SISWA PKL',
      subtitle: 'GO PKL - Sistem Monitoring Praktik Kerja Lapangan',
      metaLines: [
        ['Periode Laporan', period],
        ['Tanggal Dibuat', formatDateID(new Date())],
        ['Total Data', `${rows.length} data`],
      ],
      columns,
      rows,
      emptyMessage: 'Tidak ada data absensi yang dapat diexport.',
    });
  } catch (error) {
    console.error('exportAbsensiPdf error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat laporan PDF.' });
  }
};

/* ================================================================
   2. GET /api/reports/logbooks/pdf
   ================================================================ */
export const exportLogbookPdf = async (req, res) => {
  try {
    const where = {
      ...buildUserScope(req, req.query, { nested: true }),
      ...buildDateWhere(req.query, 'date'),
    };
    if (req.query.status && VALID_LOGBOOK_STATUS.includes(req.query.status)) {
      where.status = req.query.status;
    }

    const data = await prisma.logbook.findMany({
      where,
      include: {
        user: { include: { class: true, teacher: true, company: { include: { mentor: true } } } },
      },
      orderBy: [{ date: 'desc' }, { userId: 'asc' }],
    });

    if (!data.length) {
      return res.status(404).json({ error: 'Tidak ada data yang dapat diexport.' });
    }

    const rows = data.map((l, idx) => {
      const id = studentIdentity(l.user);
      return {
        no: idx + 1,
        name: id.name,
        className: id.className,
        companyName: id.companyName,
        date: formatDateID(l.date),
        title: l.activityTitle,
        description: l.description,
        hours: `${l.hours} jam`,
        status: labelStatus(l.status),
        feedback: l.feedback || '-',
      };
    });

    const columns = [
      { key: 'no', label: 'No', width: 18, align: 'center' },
      { key: 'name', label: 'Nama Siswa', width: 62 },
      { key: 'className', label: 'Kelas', width: 30 },
      { key: 'companyName', label: 'Perusahaan', width: 56 },
      { key: 'date', label: 'Tanggal', width: 46 },
      { key: 'title', label: 'Judul Kegiatan', width: 60 },
      { key: 'description', label: 'Deskripsi', width: 76 },
      { key: 'hours', label: 'Jam', width: 28, align: 'center' },
      { key: 'status', label: 'Status', width: 42 },
      { key: 'feedback', label: 'Feedback Mentor', width: 82 },
    ];

    const sameStudent = req.query.studentId && data.every((l) => l.userId === data[0].userId);
    const uniqueStudent = sameStudent ? data[0].user : null;

    const filename = sameStudent
      ? `laporan-logbook-${safeFilename(uniqueStudent.name)}.pdf`
      : 'laporan-logbook.pdf';

    const metaLines = uniqueStudent
      ? [
          ['Nama Siswa', uniqueStudent.name],
          ['Kelas', uniqueStudent.class?.name || '-'],
          ['Perusahaan', uniqueStudent.company?.name || '-'],
          ['Mentor', uniqueStudent.company?.mentor?.name || '-'],
          ['Periode PKL', uniqueStudent.academicYear || '-'],
          ['Tanggal Dibuat', formatDateID(new Date())],
          ['Total Data', `${rows.length} data`],
        ]
      : [
          ['Tanggal Dibuat', formatDateID(new Date())],
          ['Total Data', `${rows.length} data`],
        ];

    streamPdfReport(res, filename, {
      title: 'LAPORAN LOGBOOK SISWA PKL',
      subtitle: 'GO PKL - Sistem Monitoring Praktik Kerja Lapangan',
      metaLines,
      columns,
      rows,
      emptyMessage: 'Tidak ada data logbook yang dapat diexport.',
    });
  } catch (error) {
    console.error('exportLogbookPdf error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat laporan PDF.' });
  }
};

/* ================================================================
   3. GET /api/reports/pkl/pdf  — Data Penempatan PKL
   ================================================================ */
export const exportPklPdf = async (req, res) => {
  try {
    const where = {
      role: 'student',
      ...buildUserScope(req, req.query, { nested: false }),
    };

    const data = await prisma.user.findMany({
      where,
      include: { class: true, teacher: true, company: { include: { mentor: true } } },
      orderBy: { name: 'asc' },
    });

    if (!data.length) {
      return res.status(404).json({ error: 'Tidak ada data yang dapat diexport.' });
    }

    const rows = data.map((u, idx) => ({
      no: idx + 1,
      name: u.name,
      username: u.email,
      className: u.class?.name || '-',
      companyName: u.company?.name || '-',
      teacherName: u.teacher?.name || '-',
      mentorName: u.company?.mentor?.name || '-',
      period: u.academicYear || '-',
      status: u.isActive ? 'Aktif' : 'Nonaktif',
    }));

    const columns = [
      { key: 'no', label: 'No', width: 18, align: 'center' },
      { key: 'name', label: 'Nama Siswa', width: 68 },
      { key: 'username', label: 'NIS / Username', width: 74 },
      { key: 'className', label: 'Kelas', width: 34 },
      { key: 'companyName', label: 'Perusahaan', width: 68 },
      { key: 'teacherName', label: 'Guru Pembimbing', width: 64 },
      { key: 'mentorName', label: 'Mentor', width: 62 },
      { key: 'period', label: 'Periode PKL', width: 50 },
      { key: 'status', label: 'Status', width: 46 },
    ];

    streamPdfReport(res, 'laporan-data-pkl.pdf', {
      title: 'LAPORAN DATA PENEMPATAN PKL',
      subtitle: 'GO PKL - Sistem Monitoring Praktik Kerja Lapangan',
      metaLines: [
        ['Tanggal Dibuat', formatDateID(new Date())],
        ['Total Siswa', `${rows.length} siswa`],
      ],
      columns,
      rows,
      emptyMessage: 'Tidak ada data siswa yang dapat diexport.',
    });
  } catch (error) {
    console.error('exportPklPdf error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat laporan PDF.' });
  }
};
