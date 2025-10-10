import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 🧩 Importar rutas
import authRoutes from "./src/routers/authRoutes.js";
import jobRoutes from "./src/routers/jobRoutes.js";
import projectRoutes from "./src/routers/projectRoutes.js";
import applicationRoutes from "./src/routers/applicationRoutes.js"; // ✅ IMPORT CORRECTO

dotenv.config();

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

// 🚀 Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/applications", applicationRoutes); // 🟣 NUEVA RUTA AGREGADA

// ⚠️ Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 💥 Manejo global de errores
app.use((err, _req, res, _next) => {
  console.error("❌ Error no manejado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// 🔊 Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 CORS permitido para: ${process.env.CLIENT_ORIGIN}`);
});
