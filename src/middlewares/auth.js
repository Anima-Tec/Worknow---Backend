import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET no está definido en .env");
}

// Middleware de autenticación mejorado para Express 5
export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ 
        error: "Token requerido o inválido",
        message: "Debe proporcionar un token Bearer válido"
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    
    // Validar que el payload tenga la estructura esperada
    if (!payload.id || !payload.email || !payload.role) {
      return res.status(401).json({ 
        error: "Token malformado",
        message: "El token no contiene la información necesaria"
      });
    }
    
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    console.error("❌ Error en autenticación:", err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Token expirado",
        message: "Su sesión ha expirado, por favor inicie sesión nuevamente"
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: "Token inválido",
        message: "El token proporcionado no es válido"
      });
    }
    
    return res.status(401).json({ 
      error: "Error de autenticación",
      message: "No se pudo verificar la autenticación"
    });
  }
};

// Middleware para verificar que el usuario sea una empresa
export const requireCompany = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "No autenticado",
      message: "Debe estar autenticado para acceder a este recurso"
    });
  }
  
  if (req.user.role !== "COMPANY") {
    return res.status(403).json({ 
      error: "Acceso denegado",
      message: "Solo las empresas pueden acceder a este recurso"
    });
  }
  
  next();
};

// Middleware para verificar que el usuario sea un usuario normal
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "No autenticado",
      message: "Debe estar autenticado para acceder a este recurso"
    });
  }
  
  if (req.user.role !== "USER") {
    return res.status(403).json({ 
      error: "Acceso denegado",
      message: "Solo los usuarios pueden acceder a este recurso"
    });
  }
  
  next();
};
