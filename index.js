import dotenv from "dotenv";
dotenv.config(); // ✅ Cargar variables antes de todo

import express from "express";
import cors from "cors";
import authRoutes from "./src/routers/authRoutes.js";
import jobRoutes from "./src/routers/jobRoutes.js";
import projectRoutes from "./src/routers/projectRoutes.js";

const app = express();

// 🧩 Middleware base
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🩺 Healthcheck
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Servidor WorkNow corriendo ✅" });
});

// 🚀 Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/projects", projectRoutes);

// 🔊 Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 CORS permitido para: ${process.env.CLIENT_ORIGIN}`);
  console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? "✅ cargado" : "❌ no definido"}`);
});
