import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routers/authRoutes.js";
import jobRoutes from "./src/routers/jobRoutes.js";
import projectRoutes from "./src/routers/projectRoutes.js";
import applicationRoutes from "./src/routers/applicationRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Servidor WorkNow corriendo ✅" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/applications", applicationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);
