import express from 'express';
import { login, register, getMe, changePassword, deleteAccount } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, changePassword);
router.post('/delete-account', authMiddleware, deleteAccount);

export default router;