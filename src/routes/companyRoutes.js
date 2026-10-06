import express from 'express';

import multer from 'multer';

import {
  getCompanies,
  createCompany,
  importCompanies,
  downloadCompanyTemplate,
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

router.get(
  '/template',
  authMiddleware,
  authorize('hubin'),
  downloadCompanyTemplate
);

router.post(
  '/import',
  authMiddleware,
  authorize('hubin'),
  upload.single('file'),
  importCompanies
);

router.post('/', authMiddleware, authorize('hubin'), createCompany);
router.patch('/:id', authMiddleware, authorize('hubin'), updateCompany);
router.delete('/:id', authMiddleware, authorize('hubin'), deactivateCompany);
router.delete('/:id/hard', authMiddleware, authorize('hubin'), deleteCompany);

export default router;