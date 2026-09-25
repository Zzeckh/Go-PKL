import express from 'express';
import {
  getAcademicYears,
  getActiveAcademicYear
} from '../controllers/academicYearController.js';

const router = express.Router();

router.get('/', getAcademicYears);
router.get('/active', getActiveAcademicYear);

export default router;