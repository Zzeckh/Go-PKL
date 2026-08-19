import express from 'express';
import { getPerizinan, getMapLocations } from '../controllers/staticController.js';

const router = express.Router();

router.get('/perizinan', getPerizinan);
router.get('/locations', getMapLocations);

export default router;
