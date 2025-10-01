import { Router } from "express";
import {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
} from "../controllers/jobController.js";

const router = Router();
router.post("/", createJobController);
router.get("/", getJobsController);
router.get("/:id", getJobByIdController);
router.put("/:id", updateJobController);
router.delete("/:id", deleteJobController);

export default router;
