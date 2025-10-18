import express from "express";
import {
  applyToJobController,
  getCompanyJobApplicationsController,
  updateJobApplicationStatusController,
  getMyJobApplicationsController,
} from "../controllers/jobApplicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";
import { validateId, validateRequired, sanitizeInput } from "../middlewares/validation.js";

const router = express.Router();

// ===========================
// 🧩 POSTULACIONES DE USUARIOS
// ===========================

// Usuario se postula a un trabajo
router.post("/job/:id/apply", 
  requireAuth, 
  requireUser,
  validateId,
  sanitizeInput,
  applyToJobController
);

// Usuario ve sus propias postulaciones a trabajos
router.get("/user/me", requireAuth, requireUser, getMyJobApplicationsController);

// ===========================
// 🧩 POSTULACIONES DE EMPRESAS
// ===========================

// Empresa ve las postulaciones a sus trabajos
router.get("/company/me", requireAuth, requireCompany, getCompanyJobApplicationsController);

// Empresa actualiza el estado de una postulación (aceptar / rechazar / en revisión)
router.put("/company/:id/status", 
  requireAuth, 
  requireCompany,
  validateId,
  validateRequired(["status"]),
  sanitizeInput,
  updateJobApplicationStatusController
);

// ✅ Eliminado el catch-all (Express 5 no permite comodines dentro de routers)

export default router;
