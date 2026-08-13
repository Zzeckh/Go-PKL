import express from 'express';
import { getCompanies, getPerizinan, getMapLocations } from '../controllers/staticController.js';

const router = express.Router();

router.get('/companies', getCompanies);
router.get('/perizinan', getPerizinan);
router.get('/locations', getMapLocations);

export default router;
