import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import absensiRoutes from "./src/routes/absensiRoutes.js";
import logbookRoutes from "./src/routes/logbookRoutes.js";
import staticRoutes from "./src/routes/staticRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Ujikom Go PKL backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/logbook", logbookRoutes);
app.use("/api/static", staticRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
