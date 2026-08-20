import express from 'express';
import { getUsers, updateUser } from '../controllers/usersController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getUsers);
router.patch('/:id', authMiddleware, updateUser);
export default router;
