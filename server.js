import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';

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
import superAdminRoutes from './src/routes/superAdminRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

const app = express();

/* ── 1. Core middleware ── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

/* ── 2. Static: uploaded files (PDF surat izin) ── */
app.use('/uploads', express.static(path.resolve('uploads')));

/* ── 3. Health check ── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Go-PKL API' }));

/* ── 4. Routes ── */
app.use('/api/auth', authRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/logbook', logbookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/static', staticRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/reports', reportRoutes);

/* ── 4. 404 handler ── */
app.use((req, res) => {
  res.status(404).json({ error: `Route tidak ditemukan: ${req.method} ${req.path}` });
});

/* ── 5. Central error handler (WAJIB di akhir) ── */
app.use(errorHandler);

/* ── 6. Start ── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Go-PKL API running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});
