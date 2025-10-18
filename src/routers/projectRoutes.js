// src/routers/projectRoutes.js
import express from "express";
import {
  createProjectController,
  listPublicProjectsController,
  getCompanyProjectsController,
  getProjectByIdController,
} from "../controllers/projectController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";
import { validateId, validateRequired, sanitizeInput } from "../middlewares/validation.js";

const router = express.Router();

// ===========================
// 💼 RUTAS PRIVADAS (EMPRESAS)
// ===========================

// Crear un nuevo proyecto (solo empresa autenticada)
router.post("/", 
  requireAuth, 
  requireCompany,
  sanitizeInput,
  validateRequired(["title", "description"]),
  createProjectController
);

// Ver los proyectos creados por la empresa logueada
router.get("/company/me", requireAuth, requireCompany, getCompanyProjectsController);

// ===========================
// 🌍 RUTAS PÚBLICAS
// ===========================

// Ver todos los proyectos disponibles públicamente
router.get("/", listPublicProjectsController);

// Ver detalles de un proyecto específico por ID
router.get("/:id", validateId, getProjectByIdController);

// ✅ Eliminado el catch-all (Express 5 no admite comodines en routers)

export default router;
