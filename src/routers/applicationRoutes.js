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
  getCompanyNotificationCountController,
  markCompanyApplicationsAsReadController,
  markAllAsReadForUserController,
} from "../controllers/applicationController.js";
import { requireAuth, requireCompany, requireUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/project/:id/apply", requireAuth, requireUser, applyToProjectController);

router.post("/job/:id/apply", requireAuth, requireUser, applyToJobController);

router.get("/user/me", requireAuth, requireUser, getMyApplicationsController);

router.put("/user/:id/status", requireAuth, requireUser, updateMyApplicationStatusController);


router.get("/company/me", requireAuth, requireCompany, getCompanyApplicationsController);

router.put("/company/:id/status", requireAuth, requireCompany, updateApplicationStatusController);

router.get("/notifications/count", requireAuth, getNotificationCountController);

router.put("/notifications/:id/mark-read", requireAuth, markAsReadController);
router.get("/notifications/company", requireAuth, requireCompany, getCompanyNotificationCountController);
router.patch("/notifications/company/mark-as-read", requireAuth, requireCompany, markCompanyApplicationsAsReadController);
router.put("/notifications/user/read", requireAuth, requireUser, markAllAsReadForUserController);


export default router;
