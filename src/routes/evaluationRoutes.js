import express from 'express';
import { getEvaluations, getRekap, upsertEvaluation } from '../controllers/evaluationController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getEvaluations);
router.get('/rekap', authMiddleware, getRekap);
router.post('/', authMiddleware, authorize('mentor', 'teacher'), upsertEvaluation);
export default router;