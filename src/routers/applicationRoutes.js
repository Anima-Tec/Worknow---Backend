import express from "express";
import {
  applyToProjectController,
  applyToJobController,
  getCompanyApplicationsController,
  getCompanyJobApplicationsController,
  updateApplicationStatusController,
  getMyApplicationsController,
  markAsReadController,
  getNotificationCountController,
  updateMyApplicationStatusController,
  getCompanyNotificationCountController,
  markCompanyApplicationsAsReadController,
  markAllAsReadForUserController,
  updateJobApplicationStatusController,
} from "../controllers/applicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";
import { validateId, validateRequired, sanitizeInput } from "../middlewares/validation.js";

const router = express.Router();

// Ruta específica para postularse a proyectos
router.post("/:projectId", 
  requireAuth, 
  requireUser,
  validateId,
  validateRequired(["name", "email"]),
  sanitizeInput,
  applyToProjectController
);

router.post("/project/:id/apply", 
  requireAuth, 
  requireUser,
  validateId,
  sanitizeInput,
  applyToProjectController
);

router.post("/job/:id/apply", 
  requireAuth, 
  requireUser,
  validateId,
  sanitizeInput,
  applyToJobController
);


// Endpoint para que usuarios vean sus postulaciones a proyectos
router.get("/user/me", requireAuth, requireUser, getMyApplicationsController);

// Endpoint para que usuarios actualicen el estado de sus postulaciones aceptadas
router.put("/user/:id/status", 
  requireAuth, 
  requireUser,
  validateId,
  validateRequired(["status"]),
  sanitizeInput,
  updateMyApplicationStatusController
);

// Endpoints separados para proyectos y trabajos
router.get("/company/me", requireAuth, requireCompany, getCompanyApplicationsController);
router.get("/job-applications/company/me", requireAuth, requireCompany, getCompanyJobApplicationsController);

// Ruta para obtener aplicaciones de una empresa específica por ID
router.get("/company/:id", requireAuth, requireCompany, getCompanyApplicationsController);

router.put("/company/:id/status", 
  requireAuth, 
  requireCompany,
  validateId,
  validateRequired(["status"]),
  sanitizeInput,
  updateApplicationStatusController
);

// Ruta para actualizar estado de aplicación de trabajo
router.put("/job-applications/company/:id/status", 
  requireAuth, 
  requireCompany,
  validateId,
  validateRequired(["status"]),
  sanitizeInput,
  updateJobApplicationStatusController
);

router.get("/notifications/count", requireAuth, getNotificationCountController);

router.put("/notifications/:id/mark-read", 
  requireAuth,
  validateId,
  markAsReadController
);
router.get("/notifications/company", requireAuth, requireCompany, getCompanyNotificationCountController);
router.put("/notifications/company/read", requireAuth, requireCompany, markCompanyApplicationsAsReadController);
router.patch("/notifications/company/mark-as-read", requireAuth, requireCompany, markCompanyApplicationsAsReadController);
router.put("/notifications/user/read", requireAuth, requireUser, markAllAsReadForUserController);


export default router;
