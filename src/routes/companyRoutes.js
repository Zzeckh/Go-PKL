import express from 'express';
import { getCompanies, createCompany, updateCompany, deactivateCompany } from '../controllers/companyController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getCompanies);
router.post('/', authMiddleware, authorize('hubin'), createCompany);
router.patch('/:id', authMiddleware, authorize('hubin'), updateCompany);
router.delete('/:id', authMiddleware, authorize('hubin'), deactivateCompany);
export default router;