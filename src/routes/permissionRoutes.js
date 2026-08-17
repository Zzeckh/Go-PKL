import express from 'express';
import { getPermissions, createPermission, reviewPermission } from '../controllers/permissionController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getPermissions);
router.post('/', authMiddleware, authorize('student'), createPermission);
router.put('/:id', authMiddleware, authorize('teacher', 'mentor'), reviewPermission);
export default router;