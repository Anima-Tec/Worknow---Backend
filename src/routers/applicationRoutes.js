import express from "express";
import {
  listCompanyApplicationsController,
  applyToProjectController,
  updateApplicationStatusController,
} from "../controllers/applicationController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";

const router = express.Router();

// 🟣 Empresa ve todas sus postulaciones
router.get("/company/:id", requireAuth, requireCompany, listCompanyApplicationsController);

// 🟣 Usuario se postula a un proyecto
router.post("/project/:id/apply", applyToProjectController);

// 🟣 Empresa actualiza el estado de una postulación
router.put("/:id/status", requireAuth, requireCompany, updateApplicationStatusController);

export default router;
