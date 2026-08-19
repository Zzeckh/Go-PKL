import express from 'express';
import { getUsers } from '../controllers/usersController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getUsers);
export default router;
