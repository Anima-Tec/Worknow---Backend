// src/routers/jobRoutes.js
import express from "express";
import {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  getCompanyJobsController,
  listPublicJobsController,
} from "../controllers/jobController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";
import { validateId, validateRequired, sanitizeInput } from "../middlewares/validation.js";

const router = express.Router();

// ===========================
// 💼 RUTAS PARA EMPRESAS
// ===========================

// Crear un nuevo trabajo (solo empresa autenticada)
router.post("/", 
  requireAuth, 
  requireCompany,
  sanitizeInput,
  validateRequired(["title", "description"]),
  createJobController
);

// Ver los trabajos creados por la empresa logueada
router.get("/company/me", requireAuth, requireCompany, getCompanyJobsController);

// Actualizar un trabajo (solo empresa)
router.put("/:id", 
  requireAuth, 
  requireCompany,
  validateId,
  sanitizeInput,
  updateJobController
);

// Eliminar un trabajo (solo empresa)
router.delete("/:id", 
  requireAuth, 
  requireCompany,
  validateId,
  deleteJobController
);

// ===========================
// 🌍 RUTAS PÚBLICAS
// ===========================

// Ver todos los trabajos disponibles (público)
router.get("/", getJobsController);

// Ver un trabajo específico por su ID (público)
router.get("/:id", validateId, getJobByIdController);

// Ver lista pública especial (si aplica lógica distinta)
router.get("/public/list", listPublicJobsController);

// ✅ Eliminado el catch-all (Express 5 no permite comodines dentro de routers)

export default router;
