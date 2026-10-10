import express from 'express';

import {
  getUsers,
  getTeacherCompanies,
  updateUser,
  createMentor
} from '../controllers/usersController.js';

import {
  authMiddleware,
  authorize
} from '../middleware/auth.js';

const router = express.Router();


// ============================================================
// GET USERS
// ============================================================

router.get(
  '/',
  authMiddleware,
  getUsers
);


// ============================================================
// GET COMPANIES MILIK GURU
// ============================================================

router.get(
  '/teacher-companies',
  authMiddleware,
  authorize('teacher'),
  getTeacherCompanies
);


// ============================================================
// CREATE MENTOR
// ============================================================

router.post(
  '/mentor',
  authMiddleware,
  authorize('teacher'),
  createMentor
);


// ============================================================
// UPDATE USER
// ============================================================
// Catatan: pengecekan role (hubin / teacher) dilakukan di
// dalam controller updateUser.

router.patch(
  '/:id',
  authMiddleware,
  updateUser
);


// ============================================================
// EXPORT ROUTER
// ============================================================

export default router;