import express from 'express';
import { authMiddleware, authorize } from '../middleware/auth.js';
import {
  getTeacherCompanies,
  assignCompanyMentor,
  getCompanyMentorRoster,
  getAvailableMentors,
  updateCompanyMentorRoster,
} from '../controllers/mentorMappingController.js';

const router = express.Router();
router.use(authMiddleware);

// Guru Pembimbing menetapkan mentor untuk perusahaan yang memiliki siswa bimbingannya.
router.get('/teacher/companies', authorize('teacher'), getTeacherCompanies);
router.patch('/teacher/companies/:companyId/mentor', authorize('teacher'), assignCompanyMentor);

// Hubin mengelola daftar mentor yang terdaftar pada tiap perusahaan.
router.get('/roster', authorize('hubin'), getCompanyMentorRoster);
router.get('/mentors', authorize('hubin'), getAvailableMentors);
router.put('/roster/:companyId', authorize('hubin'), updateCompanyMentorRoster);

export default router;
