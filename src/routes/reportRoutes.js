import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { exportAbsensiPdf, exportLogbookPdf, exportPklPdf } from '../controllers/reportController.js';

const router = express.Router();

router.get('/absensi/pdf', authMiddleware, exportAbsensiPdf);
router.get('/logbooks/pdf', authMiddleware, exportLogbookPdf);
router.get('/pkl/pdf', authMiddleware, exportPklPdf);

export default router;
