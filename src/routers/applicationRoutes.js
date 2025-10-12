import express from "express";
import {
  applyToProjectController,
  getCompanyApplicationsController,
  updateApplicationStatusController,
} from "../controllers/applicationController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";

const router = express.Router();

// Usuario se postula a proyecto (AGREGAR requireAuth)
router.post("/project/:id/apply", requireAuth, applyToProjectController);

// Empresa ve sus postulaciones
router.get("/company/me", requireAuth, requireCompany, getCompanyApplicationsController);

// Empresa actualiza el estado de una postulación
router.put("/:id", requireAuth, requireCompany, updateApplicationStatusController);

export default router;