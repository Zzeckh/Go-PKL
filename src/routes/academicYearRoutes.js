import express from 'express';
import {
  getAcademicYears,
  getActiveAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from '../controllers/academicYearController.js';
import {
  authenticate,
  requireRole
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAcademicYears);
router.get('/active', getActiveAcademicYear);
router.post('/', authenticate, requireRole('hubin'), createAcademicYear);
router.patch('/:id', authenticate, requireRole('hubin'), updateAcademicYear);
router.delete('/:id', authenticate, requireRole('hubin'), deleteAcademicYear);

export default router;
