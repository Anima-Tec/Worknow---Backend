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

// ===========================
// 🧩 REGISTRO
// ===========================

// Registro de usuario normal
router.post("/register/user", registerUser);

// Registro de empresa
router.post("/register/company", registerCompany);

// ===========================
// 🔐 LOGIN
// ===========================
router.post("/login", login);

// ===========================
// 👤 PERFIL (TOKEN REQUERIDO)
// ===========================
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

// ✅ Eliminamos la ruta catch-all (ya no compatible dentro del router)
export default router;
