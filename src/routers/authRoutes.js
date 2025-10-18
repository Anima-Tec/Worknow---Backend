import { Router } from "express";
import {
  login,
  registerUser,
  registerCompany,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateRequired, validateEmail, validatePassword, validateUruguayanPhone, validateURL, validateNumber, sanitizeInput } from "../middlewares/validation.js";

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
  validateUruguayanPhone,
  validateURL("sitioWeb"),
  validateURL("twitter"),
  validateURL("facebook"),
  validateNumber("fundada"),
  validateNumber("empleados"),
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
  validateUruguayanPhone,
  validateURL("sitioWeb"),
  validateURL("twitter"),
  validateURL("facebook"),
  validateNumber("fundada"),
  validateNumber("empleados"),
  updateProfile
);

// ✅ Eliminamos la ruta catch-all (ya no compatible dentro del router)
export default router;
