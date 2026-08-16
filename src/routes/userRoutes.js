import express from 'express';
import { getAllUsers } from '../controllers/usersController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getAllUsers);
export default router;