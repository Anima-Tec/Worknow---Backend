import express from "express";
import {
  applyToProjectController,
  applyToJobController,
  getCompanyApplicationsController,
  updateApplicationStatusController,
  getMyApplicationsController,
  markAsReadController,
  getNotificationCountController,
  updateMyApplicationStatusController,
} from "../controllers/applicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Usuario se postula a proyecto
router.post("/project/:id/apply", requireAuth, requireUser, applyToProjectController);

// ✅ Usuario se postula a trabajo
router.post("/job/:id/apply", requireAuth, requireUser, applyToJobController);

// ✅ Empresa ve sus postulaciones (💡 ESTA ES LA QUE FALLA)
router.get("/company/me", requireAuth, requireCompany, getCompanyApplicationsController);

// ✅ Empresa actualiza estado
router.put("/:id", requireAuth, requireCompany, updateApplicationStatusController);

// ✅ Usuario obtiene sus postulaciones
router.get("/user/me", requireAuth, requireUser, getMyApplicationsController);

// ✅ Notificaciones
router.get("/notifications/count", requireAuth, getNotificationCountController);

// ✅ Marcar como leída
router.put("/:id/mark-read", requireAuth, markAsReadController);

// ✅ Usuario actualiza estado (Hecho / No hecho)
router.put("/user/:id/status", requireAuth, updateMyApplicationStatusController);

export default router;
