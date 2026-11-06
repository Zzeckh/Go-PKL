import express from 'express';
import {
  getLearningAchievements,
  getLearningGoals,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  setAchievementSignature,
  updateLearningGoals,
} from '../controllers/learningController.js';
import { authMiddleware, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/students/:studentId/achievements', authMiddleware, getLearningAchievements);
router.get('/students/:studentId/goals', authMiddleware, getLearningGoals);

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
