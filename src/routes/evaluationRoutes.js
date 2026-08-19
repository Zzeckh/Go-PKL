import express from 'express';
import { getEvaluations, createEvaluation, updateEvaluation } from '../controllers/evaluationController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getEvaluations);
router.post('/', authMiddleware, authorize('mentor', 'teacher'), createEvaluation);
router.put('/:id', authMiddleware, authorize('mentor', 'teacher'), updateEvaluation);
export default router;
