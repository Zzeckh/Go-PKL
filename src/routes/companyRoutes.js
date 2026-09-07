import express from 'express';
import multer from 'multer';

import {
  getCompanies,
  createCompany,
  importCompanies,
  updateCompany,
  deactivateCompany,
  deleteCompany
} from '../controllers/companyController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get('/', authMiddleware, getCompanies);
router.post(
  '/import',
  authMiddleware,
  authorize('hubin', 'super_admin'),
  upload.single('file'),
  importCompanies
);

router.post('/', authMiddleware, authorize('hubin', 'super_admin'), createCompany);
router.patch('/:id', authMiddleware, authorize('hubin', 'super_admin'), updateCompany);
router.delete('/:id', authMiddleware, authorize('hubin'), deactivateCompany);
router.delete('/:id/hard', authMiddleware, authorize('super_admin'), deleteCompany);
export default router;