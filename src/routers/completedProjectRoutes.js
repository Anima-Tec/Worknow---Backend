// src/routers/completedProjectRoutes.js
import express from "express";
import { 
  addCompletedProjectController, 
  getMyCompletedProjectsController,
  deleteCompletedProjectController
} from "../controllers/completedProjectController.js";
import { requireAuth, requireUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", requireAuth, requireUser, addCompletedProjectController);
router.get("/my-projects", requireAuth, requireUser, getMyCompletedProjectsController);
router.delete("/:id", requireAuth, requireUser, deleteCompletedProjectController);

export default router;