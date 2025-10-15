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

// ===========================
// ⚠️ RUTA CATCH-ALL (EXPRESS 5 SAFE)
// ===========================
// Evita el error "Missing parameter name at index 1: *"
router.all("/:splat(*)", (req, res) => {
  res.status(404).json({
    error: "Ruta de autenticación no encontrada",
    path: req.originalUrl,
  });
});

export default router;
