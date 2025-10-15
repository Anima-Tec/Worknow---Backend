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

// ===========================
// 🧩 POSTULACIONES USUARIO
// ===========================

// Usuario se postula a proyecto
router.post("/project/:id/apply", requireAuth, requireUser, applyToProjectController);

// Usuario se postula a trabajo
router.post("/job/:id/apply", requireAuth, requireUser, applyToJobController);

// Usuario obtiene todas sus postulaciones
router.get("/user/me", requireAuth, requireUser, getMyApplicationsController);

// Usuario actualiza el estado de su propia postulación (Hecho / No hecho)
router.put("/user/:id/status", requireAuth, requireUser, updateMyApplicationStatusController);

// ===========================
// 🧩 EMPRESA
// ===========================

// Empresa obtiene todas las postulaciones a sus proyectos/trabajos
router.get("/company/me", requireAuth, requireCompany, getCompanyApplicationsController);

// Empresa actualiza el estado de una postulación específica
router.put("/company/:id/status", requireAuth, requireCompany, updateApplicationStatusController);

// ===========================
// 🧩 NOTIFICACIONES
// ===========================

// Contador de notificaciones no leídas
router.get("/notifications/count", requireAuth, getNotificationCountController);

// Marcar postulación como leída
router.put("/notifications/:id/mark-read", requireAuth, markAsReadController);

// ✅ Eliminado el catch-all incompatible con Express 5

export default router;
