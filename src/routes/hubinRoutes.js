import { Router } from 'express';
import multer from 'multer';

import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  downloadStudentImportTemplate,
  previewStudentImport,
} from '../controllers/studentImportController.js';

import {
  getStats,
  getClasses,
  createClass,
  deleteClass,
  getClassStudents,

  getUsers,
  toggleUser,
  deleteUser,
  updateUserRole,
  resetPassword,

  getStudentsForDeactivation,
  deactivateStudents,
  activateUser,
} from '../controllers/hubinController.js';

const router = Router();
const studentImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Semua route pengelolaan ini hanya dapat diakses oleh Hubin
router.use(authenticate, requireRole('hubin'));

// =========================
// DASHBOARD
// =========================

router.get('/stats', getStats);

// Import siswa hanya melakukan preview; penyimpanan akun belum tersedia.
router.get('/students/import-template', downloadStudentImportTemplate);
router.post(
  '/students/import-preview',
  studentImportUpload.single('file'),
  previewStudentImport
);

// =========================
// KELOLA KELAS
// =========================

router.get('/classes', getClasses);
router.post('/classes', createClass);
router.delete('/classes/:id', deleteClass);
router.get('/classes/:id/students', getClassStudents);

// =========================
// KELOLA PENGGUNA
// =========================

router.get('/users', getUsers);

router.patch('/users/:id/toggle', toggleUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetPassword);

// =========================
// ALUMNI / KELUAR SEKOLAH
// =========================

// Mengambil siswa aktif berdasarkan:
// - kategori
// - tahun ajaran
// - kelas
// - pencarian
router.get(
  '/deactivation-students',
  getStudentsForDeactivation
);

// Menonaktifkan banyak siswa sekaligus
router.post(
  '/deactivate-students',
  deactivateStudents
);

// Mengaktifkan kembali user
router.patch(
  '/users/:id/activate',
  activateUser
);

export default router;