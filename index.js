import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 🔹 Importar routers
import authRoutes from "./src/routers/authRoutes.js";
import jobRoutes from "./src/routers/jobRoutes.js";
import projectRoutes from "./src/routers/projectRoutes.js";
import applicationRoutes from "./src/routers/applicationRoutes.js";
import completedProjectRoutes from "./src/routers/completedProjectRoutes.js";
import jobApplicationRoutes from "./src/routers/jobApplicationRoutes.js";

dotenv.config();

const app = express();

// ===========================
// 🧩 MIDDLEWARES GLOBALES
// ===========================
app.use(express.json());

// ✅ Configuración CORS
app.use(
  cors({
    origin: [
      "https://worknow.anima.edu.uy", // Frontend producción
      "http://localhost:5173",        // Frontend desarrollo
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===========================
// 🚀 RUTAS PRINCIPALES
// ===========================
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Servidor WorkNow corriendo ✅" });
});

// 🔹 Endpoints principales
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/job-applications", jobApplicationRoutes); // Nueva ruta para job applications
app.use("/api/completed-projects", completedProjectRoutes);

// ===========================
// ⚠️ CATCH-ALL GLOBAL (EXPRESS 5 COMPATIBLE)
// ===========================
// Maneja todas las rutas inexistentes sin usar comodines (*)
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// ===========================
// 🚨 MANEJO GLOBAL DE ERRORES (EXPRESS 5)
// ===========================
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  
  // Si es un error de validación de Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: "Dato duplicado",
      message: "Ya existe un registro con estos datos"
    });
  }
  
  // Si es un error de registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: "Registro no encontrado",
      message: "El recurso solicitado no existe"
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === 'development' ? err.message : "Algo salió mal"
  });
});

// ===========================
// 💻 INICIO DEL SERVIDOR
// ===========================
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`🚀 Servidor WorkNow escuchando en puerto ${PORT}`);
});
