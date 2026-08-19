import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getStats,
  getSchools,
  createSchool,
  deleteSchool,
  getUsers,
  toggleUser,
  getCompanies,
} from '../controllers/superAdminController.js';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/stats', getStats);
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.delete('/schools/:id', deleteSchool);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);
router.get('/companies', getCompanies);

export default router;