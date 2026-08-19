import express from 'express';
import { getLogbooks, createLogbook, updateLogbook } from '../controllers/logbookController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getLogbooks);
router.post('/', authMiddleware, createLogbook);
router.put('/:id', authMiddleware, updateLogbook);
export default router;
