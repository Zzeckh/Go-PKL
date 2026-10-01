import express from "express";
import { getAllAbsensi, createAbsensi, getAbsensiByUser, getDailyStatus, checkoutAbsensi } from "../controllers/absensiController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllAbsensi);
router.post("/", authMiddleware, createAbsensi);
router.post("/checkout", authMiddleware, checkoutAbsensi);
router.get("/status", authMiddleware, getDailyStatus);
router.get("/user/:userId", authMiddleware, getAbsensiByUser);

export default router;
