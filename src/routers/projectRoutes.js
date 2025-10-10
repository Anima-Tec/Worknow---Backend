import { Router } from "express";
import {
  createProjectController,
  listPublicProjectsController,
  getCompanyProjectsController,
} from "../controllers/projectController.js";

import {
  applyToProjectController,
  listCompanyApplicationsController,
  updateApplicationStatusController, // ✅ nuevo
} from "../controllers/applicationController.js";

import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";

const router = Router();

// 🟣 Público — ver todos los proyectos activos
router.get("/", listPublicProjectsController);

// 🟣 Empresa — crear proyecto
router.post("/", requireAuth, requireCompany, createProjectController);

// 🟣 Empresa — ver sus propios proyectos
router.get("/company/me", requireAuth, requireCompany, getCompanyProjectsController);

// 🟣 Usuario — postularse a un proyecto
router.post("/:id/apply", requireAuth, requireUser, applyToProjectController);

// 🟣 Empresa — ver postulaciones recibidas
router.get(
  "/applications/company/me",
  requireAuth,
  requireCompany,
  listCompanyApplicationsController
);

// 🟣 Empresa — actualizar estado de postulación (aceptar / rechazar / revisión)
router.put(
  "/applications/:id",
  requireAuth,
  requireCompany,
  updateApplicationStatusController
);

export default router;
