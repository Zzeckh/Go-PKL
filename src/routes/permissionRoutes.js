import express from 'express';
import { getPermissions, createPermission, updatePermission, deletePermission, uploadPermissionFile } from '../controllers/permissionController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getPermissions);
router.post('/', authMiddleware, authorize('student'), uploadPermissionFile.single('file'), createPermission);
router.put('/:id', authMiddleware, authorize('teacher', 'mentor'), updatePermission);
router.delete('/:id', authMiddleware, authorize('student'), deletePermission);
export default router;