// src/middlewares/validation.js
// Middleware de validación para Express 5

// Validar que el ID sea un número válido
export const validateId = (req, res, next) => {
  const { id } = req.params;
  
  if (id && isNaN(Number(id))) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El ID debe ser un número válido"
    });
  }
  
  next();
};

// Validar campos requeridos
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of fields) {
      if (!req.body[field]) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: "Campos requeridos faltantes",
        message: `Los siguientes campos son obligatorios: ${missing.join(', ')}`
      });
    }
    
    next();
  };
};

// Validar email
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Email inválido",
        message: "El formato del email no es válido"
      });
    }
  }
  
  next();
};

// Validar longitud de contraseña
export const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (password && password.length < 6) {
    return res.status(400).json({
      error: "Contraseña muy corta",
      message: "La contraseña debe tener al menos 6 caracteres"
    });
  }
  
  next();
};

// Validar teléfono uruguayo (+598XXXXXXXX) - Solo si está presente
export const validateUruguayanPhone = (req, res, next) => {
  const { telefono } = req.body;
  
  if (telefono && telefono.trim() !== '') {
    // Expresión regular para teléfono uruguayo: +598 seguido de exactamente 8 dígitos
    const phoneRegex = /^\+598\d{8}$/;
    
    if (!phoneRegex.test(telefono.trim())) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: "El teléfono debe tener el formato +598XXXXXXXX (8 dígitos después del código de país)"
      });
    }
  }
  
  next();
};

// Validar RUT uruguayo
export const validateRUT = (req, res, next) => {
  const { rut } = req.body;
  
  if (rut && rut.trim() !== '') {
    // Formato uruguayo: 12.345.678-9
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-\d{1}$/;
    
    if (!rutRegex.test(rut.trim())) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: "El RUT debe tener el formato uruguayo (ej: 12.345.678-9)"
      });
    }
  }
  
  next();
};

// Validar ciudad (departamentos de Uruguay)
export const validateUruguayCity = (req, res, next) => {
  const { ciudad } = req.body;
  
  if (ciudad && ciudad.trim() !== '') {
    const departamentosUruguay = [
      "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
      "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
      "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
      "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
    ];
    
    if (!departamentosUruguay.includes(ciudad.trim())) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: "La ciudad debe ser uno de los departamentos de Uruguay"
      });
    }
  }
  
  next();
};

// Validar tamaño de empresa
export const validateCompanySize = (req, res, next) => {
  const { tamano } = req.body;
  
  if (tamano && tamano.trim() !== '') {
    const tamanosValidos = ["1-10", "11-50", "51-200", "201-500", "500+"];
    
    if (!tamanosValidos.includes(tamano.trim())) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: "El tamaño debe ser: 1-10, 11-50, 51-200, 201-500, o 500+"
      });
    }
  }
  
  next();
};

// Validar sitio web (opcional)
export const validateWebsite = (req, res, next) => {
  const { sitioWeb } = req.body;
  
  if (sitioWeb && sitioWeb.trim() !== '') {
    try {
      new URL(sitioWeb);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: "El sitio web debe ser una URL válida"
      });
    }
  }
  
  next();
};

// Sanitizar entrada de texto
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};
