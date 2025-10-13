// src/controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../database/prismaClient.js";

// ----------------------------------------
// LOGIN
// ----------------------------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar en User o Company
    const account =
      (await prisma.user.findUnique({ where: { email } })) ||
      (await prisma.company.findUnique({ where: { email } }));

    if (!account) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: account.id, email: account.email, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: { id: account.id, email: account.email, role: account.role },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ----------------------------------------
// REGISTRO DE USUARIO (versión estable)
// ----------------------------------------
export const registerUser = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      fechaNacimiento,
      ciudad,
      profesion,
      password,
    } = req.body;

    // Verificar si ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res
        .status(400)
        .json({ message: "El email ya está registrado" });

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convertir fecha a DateTime si viene como string
    let fechaConvertida = null;
    if (fechaNacimiento) {
      fechaConvertida = new Date(fechaNacimiento);
      // Validar que la fecha sea válida
      if (isNaN(fechaConvertida.getTime())) {
        return res.status(400).json({
          message: "Fecha de nacimiento inválida. Usa formato YYYY-MM-DD"
        });
      }
    }

    // Guardar usuario completo
    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        fechaNacimiento: fechaConvertida,
        ciudad,
        profesion,
        password: hashedPassword,
        role: "USER",
      },
    });

    // ✅ IMPORTANTE: No devolver el password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "✅ Usuario registrado con éxito",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("❌ Error en registerUser:", error);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Datos recibidos:", req.body);
    res.status(500).json({
      message: "Error en el registro",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ----------------------------------------
// REGISTRO DE EMPRESA
// ----------------------------------------
export const registerCompany = async (req, res) => {
  try {
    const { 
       email,
      password,
      nombreEmpresa,
      rut,
      telefono,
      direccion,
      ciudad,
      sector,
      sitioWeb,
      tamano,
      descripcion,
      logoUrl
    } = req.body;


    // Verificar si ya existe
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "La empresa ya existe" });

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nueva empresa
    const newCompany = await prisma.company.create({
        data: {
        email,
        password: hashedPassword,
        role: "COMPANY",
        nombreEmpresa,
        rut: rut || null,
        telefono: telefono || null,
        direccion: direccion || null,
        ciudad: ciudad || null,
        sector: sector || null,
        sitioWeb: sitioWeb || null,
        tamano: tamano || null,
        descripcion: descripcion || null,
        logoUrl: logoUrl || null,
      },
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: newCompany.id, email: newCompany.email, role: newCompany.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // No devolver el password
    const { password: _, ...companyWithoutPassword } = newCompany;

    return res.status(201).json({
      message: "Empresa registrada correctamente",
      token,
      company: companyWithoutPassword,
    });
  } catch (error) {
    console.error("❌ Error en registerCompany:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message});
  }
};

// ----------------------------------------
// PERFIL - OBTENER DATOS SEGÚN ROL
// ----------------------------------------
export const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user; // viene del middleware requireAuth

    if (role === "USER") {
      const user = await prisma.user.findUnique({ where: { id } });
     
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // ✅ CRÍTICO: NO devolver el password
      const { password, ...userWithoutPassword } = user;
     
      // ✅ Convertir fechaNacimiento a formato YYYY-MM-DD para el input date
      if (userWithoutPassword.fechaNacimiento) {
        userWithoutPassword.fechaNacimiento = userWithoutPassword.fechaNacimiento
          .toISOString()
          .split('T')[0];
      }

      return res.json(userWithoutPassword);
    }

    if (role === "COMPANY") {
      const company = await prisma.company.findUnique({ where: { id } });
     
      if (!company) {
        return res.status(404).json({ message: "Empresa no encontrada" });
      }

      // No devolver el password
      const { password, ...companyWithoutPassword } = company;
      return res.json(companyWithoutPassword);
    }

    return res.status(400).json({ message: "Rol no válido" });
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ----------------------------------------
// PERFIL - ACTUALIZAR DATOS SEGÚN ROL
// ----------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    const data = req.body;

    // ✅ SEGURIDAD: Eliminar campos que NO deben actualizarse directamente
    delete data.password;
    delete data.email;
    delete data.role;
    delete data.id;
    delete data.createdAt;

    if (role === "USER") {
      // ✅ Convertir fechaNacimiento si viene en el body
      if (data.fechaNacimiento) {
        const fecha = new Date(data.fechaNacimiento);
        if (isNaN(fecha.getTime())) {
          return res.status(400).json({
            message: "Fecha de nacimiento inválida"
          });
        }
        data.fechaNacimiento = fecha;
      }

      const updated = await prisma.user.update({
        where: { id },
        data
      });

      // No devolver el password
      const { password, ...updatedWithoutPassword } = updated;

      // Convertir fecha para el frontend
      if (updatedWithoutPassword.fechaNacimiento) {
        updatedWithoutPassword.fechaNacimiento = updatedWithoutPassword.fechaNacimiento
          .toISOString()
          .split('T')[0];
      }

      return res.json({
        message: "Perfil de usuario actualizado",
        updated: updatedWithoutPassword
      });
    }

    if (role === "COMPANY") {
      const updated = await prisma.company.update({
        where: { id },
        data
      });

      // No devolver el password
      const { password, ...updatedWithoutPassword } = updated;

      return res.json({
        message: "Perfil de empresa actualizado",
        updated: updatedWithoutPassword
      });
    }

    return res.status(400).json({ message: "Rol no válido" });
  } catch (error) {
    console.error("❌ Error actualizando perfil:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

