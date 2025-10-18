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

// Validar teléfono uruguayo (+598XXXXXXXX)
export const validateUruguayanPhone = (req, res, next) => {
  const { telefono } = req.body;
  
  if (telefono !== undefined && telefono !== null && telefono !== '') {
    // Expresión regular para teléfono uruguayo: +598 seguido de exactamente 8 dígitos
    const phoneRegex = /^\+598\d{8}$/;
    
    if (!phoneRegex.test(telefono)) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: "El teléfono debe tener el formato +598XXXXXXXX (8 dígitos después del código de país)"
      });
    }
  }
  
  next();
};

// Validar campos de empresa (opcional)
export const validateCompanyFields = (req, res, next) => {
  const { sitioWeb, twitter, facebook, fundada, empleados } = req.body;
  
  // Validar URLs si están presentes y no están vacías
  const urlsToValidate = [
    { field: 'sitioWeb', value: sitioWeb },
    { field: 'twitter', value: twitter },
    { field: 'facebook', value: facebook }
  ];
  
  for (const { field, value } of urlsToValidate) {
    if (value && value.trim() !== '') {
      try {
        new URL(value);
      } catch {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: `${field} debe ser una URL válida`
        });
      }
    }
  }
  
  // Validar números si están presentes
  const numbersToValidate = [
    { field: 'fundada', value: fundada },
    { field: 'empleados', value: empleados }
  ];
  
  for (const { field, value } of numbersToValidate) {
    if (value !== undefined && value !== null && value !== '') {
      if (isNaN(Number(value)) || Number(value) < 0) {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: `${field} debe ser un número válido mayor o igual a 0`
        });
      }
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
