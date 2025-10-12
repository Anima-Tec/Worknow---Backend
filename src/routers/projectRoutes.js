import express from "express";
import {
  createProjectController,
  listPublicProjectsController,
  getCompanyProjectsController,
  getProjectByIdController,
} from "../controllers/projectController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";

const router = express.Router();

// Público
router.get("/", listPublicProjectsController);
router.get("/:id", getProjectByIdController);

// Privado (empresa)
router.post("/", requireAuth, requireCompany, createProjectController);
router.get("/company/me", requireAuth, requireCompany, getCompanyProjectsController);

export default router;
