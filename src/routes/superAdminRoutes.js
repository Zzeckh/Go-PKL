import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getStats,
  getClasses, createClass, deleteClass, getClassStudents,
  getUsers, toggleUser, deleteUser, updateUserRole,
} from '../controllers/superAdminController.js';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/stats', getStats);
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.delete('/classes/:id', deleteClass);
router.get('/classes/:id/students', getClassStudents);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
