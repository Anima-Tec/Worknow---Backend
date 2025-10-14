import express from "express";
import {
  applyToProjectController,
  getCompanyApplicationsController,
  updateApplicationStatusController,
  getMyApplicationsController,
  markAsReadController,
  getNotificationCountController,
  updateMyApplicationStatusController, // ✅ IMPORT AGREGADO
} from "../controllers/applicationController.js";

import { requireAuth, requireCompany } from "../middlewares/auth.js";
// 🟣 si más adelante querés validar que solo USER acceda a ciertas rutas, 
// podés agregar acá: import { requireUser } from "../middlewares/auth.js";

const router = express.Router();

// 🧩 Usuario se postula a proyecto
router.post("/project/:id/apply", requireAuth, applyToProjectController);

// 🏢 Empresa ve sus postulaciones
router.get("/company/me", requireAuth, requireCompany, getCompanyApplicationsController);

// 🏢 Empresa actualiza el estado de una postulación
router.put("/:id", requireAuth, requireCompany, updateApplicationStatusController);

// 👤 Usuario obtiene sus propias postulaciones
router.get("/user/me", requireAuth, getMyApplicationsController);

// 🔔 Usuario obtiene cantidad de notificaciones
router.get("/notifications/count", requireAuth, getNotificationCountController);

// 👁️ Usuario marca una postulación como leída
router.put("/:id/mark-read", requireAuth, markAsReadController);

// 🟣 Usuario actualiza el estado de su propia postulación (Hecho/No hecho)
router.put("/user/:id/status", requireAuth, updateMyApplicationStatusController);

export default router;
