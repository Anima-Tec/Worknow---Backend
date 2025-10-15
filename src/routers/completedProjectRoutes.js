// src/routers/completedProjectRoutes.js
import express from "express";
import {
  addCompletedProjectController,
  getMyCompletedProjectsController,
  deleteCompletedProjectController,
} from "../controllers/completedProjectController.js";
import { requireAuth, requireUser } from "../middlewares/auth.js";

const router = express.Router();

// ===========================
// 🧩 PROYECTOS COMPLETADOS (USUARIO)
// ===========================

// Crear nuevo proyecto completado
router.post("/", requireAuth, requireUser, addCompletedProjectController);

// Obtener todos los proyectos completados del usuario autenticado
router.get("/my-projects", requireAuth, requireUser, getMyCompletedProjectsController);

// Eliminar un proyecto completado específico
router.delete("/:id", requireAuth, requireUser, deleteCompletedProjectController);

// ===========================
// ⚠️ RUTA CATCH-ALL (EXPRESS 5 SAFE)
// ===========================
// Evita errores de path-to-regexp con rutas inexistentes
router.all("/:splat(*)", (req, res) => {
  res.status(404).json({
    error: "Ruta de proyectos completados no encontrada",
    path: req.originalUrl,
  });
});

export default router;
