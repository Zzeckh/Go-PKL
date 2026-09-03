import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { exportAbsensiPdf, exportLogbookPdf, exportPklPdf, getAttendanceReport } from '../controllers/reportController.js';
import { previewReport, exportReportPreviewPdf } from '../controllers/reportPreviewController.js';

const router = express.Router();

router.get('/absensi/pdf', authMiddleware, exportAbsensiPdf);
router.get('/attendance', authMiddleware, getAttendanceReport);
router.get('/preview', authMiddleware, previewReport);
router.get('/preview/pdf', authMiddleware, exportReportPreviewPdf);
router.get('/logbooks/pdf', authMiddleware, exportLogbookPdf);
router.get('/pkl/pdf', authMiddleware, exportPklPdf);

export default router;
