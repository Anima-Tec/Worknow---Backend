import express from "express";
import {
  applyToJobController,
  getCompanyJobApplicationsController,
  updateJobApplicationStatusController,
  getMyJobApplicationsController,
} from "../controllers/jobApplicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";

const router = express.Router();

// ===========================
// 🧩 POSTULACIONES DE USUARIOS
// ===========================

// Usuario se postula a un trabajo
router.post("/job/:id/apply", requireAuth, requireUser, applyToJobController);

// Usuario ve sus propias postulaciones a trabajos
router.get("/user/me", requireAuth, requireUser, getMyJobApplicationsController);

// ===========================
// 🧩 POSTULACIONES DE EMPRESAS
// ===========================

// Empresa ve las postulaciones a sus trabajos
router.get("/company/me", requireAuth, requireCompany, getCompanyJobApplicationsController);

// Empresa actualiza el estado de una postulación (aceptar / rechazar / en revisión)
router.put("/company/:id/status", requireAuth, requireCompany, updateJobApplicationStatusController);

// ===========================
// ⚠️ RUTA CATCH-ALL (EXPRESS 5 SAFE)
// ===========================
// Evita errores de path-to-regexp y devuelve 404 limpias
router.all("/:splat(*)", (req, res) => {
  res.status(404).json({
    error: "Ruta de postulaciones a trabajos no encontrada",
    path: req.originalUrl,
  });
});

export default router;
