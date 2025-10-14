// src/routers/jobRoutes.js
import express from "express";
import {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  getCompanyJobsController,
 listPublicJobsController,
} from "../controllers/jobController.js";
import { requireAuth, requireCompany } from "../middlewares/auth.js";

const router = express.Router();

// 🟣 Solo empresas autenticadas pueden crear trabajos
router.post("/", requireAuth, requireCompany, createJobController);

// 🟣 Público: ver todos los trabajos disponibles
router.get("/", getJobsController);

// 🟣 Empresa autenticada ve sus trabajos (⚠️ Debe ir antes de "/:id")
router.get("/company/me", requireAuth, requireCompany, getCompanyJobsController);

// 🟣 Ver un trabajo por ID
router.get("/:id", getJobByIdController);

// 🟣 Actualizar o eliminar (solo empresa)
router.put("/:id", requireAuth, requireCompany, updateJobController);
router.delete("/:id", requireAuth, requireCompany, deleteJobController);
router.get("/", listPublicJobsController);

export default router;
