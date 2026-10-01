/**
 * Go-PKL API — Express app (framework + middleware + routes).
 * This module does not listen; server.js owns the local HTTP listener.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { requestLogger } from './src/middleware/requestLogger.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import absensiRoutes from './src/routes/absensiRoutes.js';
import logbookRoutes from './src/routes/logbookRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import staticRoutes from './src/routes/staticRoutes.js';
import permissionRoutes from './src/routes/permissionRoutes.js';
import evaluationRoutes from './src/routes/evaluationRoutes.js';
import companyRoutes from './src/routes/companyRoutes.js';
import hubinRoutes from './src/routes/hubinRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import academicYearRoutes from './src/routes/academicYearRoutes.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Go-PKL API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/logbook', logbookRoutes);
app.use('/api/static', staticRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/hubin', hubinRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/academic-years', academicYearRoutes);

app.use((req, res) => res.status(404).json({ error: `Route tidak ditemukan: ${req.method} ${req.path}` }));
app.use(errorHandler);
export default app;
