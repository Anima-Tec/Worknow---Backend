import { Router } from "express";
import {
  login,
  registerUser,
  registerCompany,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// 🔹 Registro
router.post("/register/user", registerUser);
router.post("/register/company", registerCompany);

// 🔹 Login
router.post("/login", login);

// 🔹 Perfil (protección con token)
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

export default router;
