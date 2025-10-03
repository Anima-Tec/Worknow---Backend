import { Router } from "express";
import {
  createProjectController,
  listPublicProjectsController,
  getCompanyProjectsController,
} from "../controllers/projectController.js";
import { applyToProjectController } from "../controllers/applicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";

const router = Router();

// Público
router.get("/", listPublicProjectsController);

// Empresa
router.post("/", requireAuth, requireCompany, createProjectController);
router.get("/company/me", requireAuth, requireCompany, getCompanyProjectsController);

// Usuario se postula
router.post("/:id/apply", requireAuth, requireUser, applyToProjectController);

export default router;
