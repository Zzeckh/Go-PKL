import express from 'express';
import { getPerizinan, getMapLocations, getClasses } from '../controllers/staticController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/perizinan', authMiddleware, getPerizinan);
router.get('/locations', getMapLocations);
router.get('/classes', getClasses);

export default router;
