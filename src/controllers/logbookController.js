import prisma from '../config/db.js';
import { parseDateOnly, sameDateRange } from '../utils/dateOnly.js';
import { ACTIVE_PERMISSION_STATUSES } from '../services/attendanceStatusService.js';

// Jika siswa punya izin/sakit yang masih AKTIF (pending/approved) pada
// tanggal tsb, logbook tidak boleh dibuat/diedit untuk tanggal itu —
// supaya logbook tidak bisa dipakai untuk "melewati" aturan kehadiran
// (KONDISI 1 & 3). 'rejected' sengaja tidak dihitung, konsisten dengan
// aturan yang sama di attendanceStatusService.js.
const findActivePermission = (userId, dateRange) =>
  prisma.permission.findFirst({
    where: { userId, date: dateRange, status: { in: ACTIVE_PERMISSION_STATUSES } },
  });

export const getLogbooks = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let where = {};

    if (role === 'student') {
      where = { userId: id };
    } else if (role === 'teacher') {
      where = { user: { teacherId: id } };
    } else if (role === 'mentor') {
      where = { user: { company: { mentorId: id } } };
    } else if (role === 'hubin') {
      where = {};
    } else if (role === 'super_admin') {
      where = {};
    }

    const logbooks = await prisma.logbook.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(logbooks);
  } catch (error) {
    next(error);
  }
};

export const createLogbook = async (req, res, next) => {
  try {
    const { activity_title, description, hours, category } = req.body;
    const userId = req.user.id;

    if (!activity_title || !description) {
      return res.status(400).json({ error: 'activity_title dan description wajib diisi' });
    }

    // Normalisasi tanggal logbook dengan util yang sama dipakai absensi/izin
    // (kalender Asia/Jakarta), supaya perbandingan tanggal antar tabel selalu
    // konsisten dan tidak melenceng karena timezone server.
    const logDate = parseDateOnly(req.body.date) || parseDateOnly(new Date());
    const dateRange = sameDateRange(logDate);
    if (!logDate || !dateRange) {
      return res.status(400).json({ error: 'Format tanggal tidak valid.' });
    }

    const activePermission = await findActivePermission(userId, dateRange);
    if (activePermission) {
      return res.status(409).json({ error: 'Anda memiliki pengajuan izin/sakit pada tanggal ini sehingga tidak dapat membuat logbook.' });
    }

    const logbook = await prisma.logbook.create({
      data: {
        userId,
        activityTitle: activity_title,
        description,
        hours: hours || 8,
        category: category || null,
        date: logDate,
        status: 'pending',
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json(logbook);
  } catch (error) {
    next(error);
  }
};

export const updateLogbook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status, feedback, activity_title, description, hours, category } = req.body;
    const { id: reviewerId, role } = req.user;

    const logbook = await prisma.logbook.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, teacherId: true, company: { select: { mentorId: true } } } },
      },
    });

    if (!logbook) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    // Student can update content if status is revision
    if (role === 'student') {
      if (logbook.userId !== reviewerId) {
        return res.status(403).json({ error: 'Tidak berhak mengubah logbook ini' });
      }
      if (logbook.status !== 'rejected') {
        return res.status(400).json({ error: 'Hanya logbook dengan status revisi yang dapat diedit' });
      }

      // Cegah edit logbook "lolos" ke tanggal yang sekarang sudah terkunci
      // izin/sakit aktif (mis. logbook dibuat dulu, izin diajukan belakangan).
      const editDateRange = sameDateRange(logbook.date);
      const activePermission = editDateRange ? await findActivePermission(reviewerId, editDateRange) : null;
      if (activePermission) {
        return res.status(409).json({ error: 'Anda memiliki pengajuan izin/sakit pada tanggal ini sehingga logbook tidak dapat diedit.' });
      }

      const updated = await prisma.logbook.update({
        where: { id },
        data: {
          activityTitle: activity_title || logbook.activityTitle,
          description: description || logbook.description,
          hours: hours || logbook.hours,
          category: category || logbook.category,
          status: 'pending',
          feedback: null,
        },
        include: {
          user: { select: { name: true } },
        },
      });
      return res.json(updated);
    }

    let allowed = false;
    if (role === 'mentor') allowed = logbook.user.company?.mentorId === reviewerId;
    else if (role === 'hubin') allowed = true;
    else if (role === 'super_admin') allowed = true;

    if (!allowed) {
      return res.status(403).json({ error: 'Tidak berhak mengubah logbook ini' });
    }

    const updated = await prisma.logbook.update({
      where: { id },
      data: { status, feedback },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteLogbook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { id: userId, role } = req.user;

    const logbook = await prisma.logbook.findUnique({ where: { id } });
    if (!logbook) {
      return res.status(404).json({ error: 'Logbook tidak ditemukan' });
    }

    if (role === 'student' && logbook.userId !== userId) {
      return res.status(403).json({ error: 'Tidak berhak menghapus logbook ini' });
    }

    await prisma.logbook.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
