// src/routers/completedProjectRoutes.js
import express from "express";
import {
  addCompletedProjectController,
  getMyCompletedProjectsController,
  deleteCompletedProjectController,
} from "../controllers/completedProjectController.js";
import { requireAuth, requireUser } from "../middlewares/auth.js";
import { validateId, validateRequired, sanitizeInput } from "../middlewares/validation.js";

const router = express.Router();

// ===========================
// 🧩 PROYECTOS COMPLETADOS (USUARIO)
// ===========================

// Crear nuevo proyecto completado
router.post("/", 
  requireAuth, 
  requireUser,
  sanitizeInput,
  validateRequired(["projectTitle", "companyName"]),
  addCompletedProjectController
);

// Obtener todos los proyectos completados del usuario autenticado
router.get("/my-projects", requireAuth, requireUser, getMyCompletedProjectsController);

// Eliminar un proyecto completado específico
router.delete("/:id", 
  requireAuth, 
  requireUser,
  validateId,
  deleteCompletedProjectController
);

// ✅ Eliminado el catch-all (Express 5 ya no permite wildcards en Routers)

export default router;
