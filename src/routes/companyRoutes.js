import express from 'express';
import { getCompanies, createCompany, updateCompany, deactivateCompany, deleteCompany } from '../controllers/companyController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getCompanies);
router.post('/', authMiddleware, authorize('hubin', 'super_admin'), createCompany);
router.patch('/:id', authMiddleware, authorize('hubin', 'super_admin'), updateCompany);
router.delete('/:id', authMiddleware, authorize('hubin'), deactivateCompany);
router.delete('/:id/hard', authMiddleware, authorize('super_admin'), deleteCompany);
export default router;