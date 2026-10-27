import express from 'express';
import { getPerizinan, getMapLocations, getClasses } from '../controllers/staticController.js';

const router = express.Router();

router.get('/perizinan', getPerizinan);
router.get('/locations', getMapLocations);
router.get('/classes', getClasses);

export default router;
