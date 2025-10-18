import { Router } from "express";
import {
  login,
  registerUser,
  registerCompany,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateRequired, validateEmail, validatePassword, validateUruguayanPhone, validateCompanyFields, sanitizeInput } from "../middlewares/validation.js";

const router = Router();

// ===========================
// 🧩 REGISTRO
// ===========================

// Registro de usuario normal
router.post("/register/user", 
  sanitizeInput,
  validateRequired(["nombre", "apellido", "email", "password"]),
  validateEmail,
  validatePassword,
  validateUruguayanPhone,
  registerUser
);

// Registro de empresa
router.post("/register/company", 
  sanitizeInput,
  validateRequired(["email", "password", "nombreEmpresa"]),
  validateEmail,
  validatePassword,
  registerCompany
);

// ===========================
// 🔐 LOGIN
// ===========================
router.post("/login", 
  sanitizeInput,
  validateRequired(["email", "password"]),
  validateEmail,
  login
);

// ===========================
// 👤 PERFIL (TOKEN REQUERIDO)
// ===========================
router.get("/profile", requireAuth, getProfile);
router.put("/profile", 
  requireAuth,
  sanitizeInput,
  updateProfile
);

// ✅ Eliminamos la ruta catch-all (ya no compatible dentro del router)
export default router;
