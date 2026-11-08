import express from 'express';
import { getPerizinan, getMapLocations, getClasses, getPrograms } from '../controllers/staticController.js';

const router = express.Router();

router.get('/perizinan', getPerizinan);
router.get('/locations', getMapLocations);
router.get('/classes', getClasses);
router.get('/programs', getPrograms);

export default router;
