// src/routers/projectRoutes.js
import express from "express";
import {
  createProjectController,
  listPublicProjectsController,
  getCompanyProjectsController,
  getProjectByIdController,
} from "../controllers/projectController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";

const router = express.Router();

// ===========================
// 💼 RUTAS PRIVADAS (EMPRESAS)
// ===========================

// Crear un nuevo proyecto (solo empresa autenticada)
router.post("/", requireAuth, requireCompany, createProjectController);

// Ver los proyectos creados por la empresa logueada
router.get("/company/me", requireAuth, requireCompany, getCompanyProjectsController);

// ===========================
// 🌍 RUTAS PÚBLICAS
// ===========================

// Ver todos los proyectos disponibles públicamente
router.get("/", listPublicProjectsController);

// Ver detalles de un proyecto específico por ID
router.get("/:id", getProjectByIdController);

// ===========================
// ⚠️ RUTA CATCH-ALL (EXPRESS 5 SAFE)
// ===========================
// Evita errores "Missing parameter name at index 1: *" y devuelve 404 claras
router.all("/:splat(*)", (req, res) => {
  res.status(404).json({
    error: "Ruta de proyectos no encontrada",
    path: req.originalUrl,
  });
});

export default router;
