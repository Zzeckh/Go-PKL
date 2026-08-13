import express from "express";
import { getAllLogbooks, createLogbook, updateLogbook } from "../controllers/logbookController.js";

const router = express.Router();

router.get("/", getAllLogbooks);
router.post("/", createLogbook);
router.put("/:id", updateLogbook);

export default router;
