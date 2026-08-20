import express from "express";
import { getAllAbsensi, createAbsensi, getAbsensiByUser } from "../controllers/absensiController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllAbsensi);
router.post("/", authMiddleware, createAbsensi);
router.get("/user/:userId", authMiddleware, getAbsensiByUser);

export default router;
