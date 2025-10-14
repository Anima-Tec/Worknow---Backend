import express from "express";
import {
  applyToJobController,
  getCompanyJobApplicationsController,
  updateJobApplicationStatusController,
  getMyJobApplicationsController
} from "../controllers/jobApplicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";

const router = express.Router();

// 🟣 Usuario se postula a un trabajo
router.post("/job/:id/apply", requireAuth, requireUser, applyToJobController);

// 🟣 Empresa ve las postulaciones a sus trabajos
router.get("/company/me", requireAuth, requireCompany, getCompanyJobApplicationsController);

// 🟣 Empresa actualiza el estado de una postulación (aceptar / rechazar / en revisión)
router.put("/:id", requireAuth, requireCompany, updateJobApplicationStatusController);

// 🟣 Usuario ve sus propias postulaciones a trabajos
router.get("/user/me", requireAuth, requireUser, getMyJobApplicationsController);

export default router;
