import express from "express";
import { getAllAbsensi, createAbsensi, getAbsensiByUser } from "../controllers/absensiController.js";

const router = express.Router();

router.get("/", getAllAbsensi);
router.post("/", createAbsensi);
router.get("/user/:userId", getAbsensiByUser);

export default router;
