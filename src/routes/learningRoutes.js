import express from 'express';
import {
  getLearningAchievements,
  getLearningGoals,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  setAchievementSignature,
  updateLearningGoals,
  getAchievementTemplates,
  createAchievementTemplate,
  updateAchievementTemplate,
  deleteAchievementTemplate,
} from '../controllers/learningController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/students/:studentId/achievements', authMiddleware, getLearningAchievements);
router.get('/students/:studentId/goals', authMiddleware, getLearningGoals);

// Template Capaian Pembelajaran per Program Keahlian — dikelola Hubin.
router.get(
  '/achievement-templates',
  authMiddleware,
  authorize('hubin'),
  getAchievementTemplates
);
router.post(
  '/achievement-templates',
  authMiddleware,
  authorize('hubin'),
  createAchievementTemplate
);
router.put(
  '/achievement-templates/:templateId',
  authMiddleware,
  authorize('hubin'),
  updateAchievementTemplate
);
router.delete(
  '/achievement-templates/:templateId',
  authMiddleware,
  authorize('hubin'),
  deleteAchievementTemplate
);

router.post('/students/:studentId/achievements', authMiddleware, authorize('mentor'), createAchievement);
router.put('/students/:studentId/achievements/:achievementId', authMiddleware, authorize('mentor'), updateAchievement);
router.delete('/students/:studentId/achievements/:achievementId', authMiddleware, authorize('mentor'), deleteAchievement);

router.put(
  '/students/:studentId/achievements/:achievementId/signature',
  authMiddleware,
  authorize('mentor', 'teacher'),
  setAchievementSignature
);

router.put('/students/:studentId/goals', authMiddleware, authorize('mentor'), updateLearningGoals);

export default router;
