import express from 'express';
import { getAllLogbooks, createLogbook, updateLogbook } from '../controllers/logbookController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getAllLogbooks);
router.post('/', authMiddleware, createLogbook);
router.put('/:id', authMiddleware, updateLogbook);
export default router;