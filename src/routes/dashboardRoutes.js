import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/stats', authMiddleware, getDashboardStats);

export default router;
