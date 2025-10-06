import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routers/authRoutes.js";
import jobRoutes from "./src/routers/jobRoutes.js";

dotenv.config();

const app = express();

// Middleware base
app.use(express.json());

// ✅ Configuración CORRECTA de CORS
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN, // tu frontend exacto
    credentials: true, // habilita envío de cookies o headers de autenticación
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Healthcheck para comprobar el backend
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Servidor WorkNow corriendo ✅" });
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 CORS permitido para: ${process.env.CLIENT_ORIGIN}`);
});
