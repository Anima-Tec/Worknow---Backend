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
// REGISTRO DE USUARIO
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
    if (existing) return res.status(400).json({ message: "El email ya está registrado" });

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en BD
    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        fechaNacimiento,
        ciudad,
        profesion,
        password: hashedPassword,
        role: "USER",
      },
    });

    return res.status(201).json({
      message: "Usuario registrado con éxito",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("❌ Error en registerUser:", error);
    return res.status(500).json({ message: "Error en el registro" });
  }
};

// ----------------------------------------
// REGISTRO DE EMPRESA
// ----------------------------------------
export const registerCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

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
      },
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: newCompany.id, email: newCompany.email, role: newCompany.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Empresa registrada correctamente",
      token,
      company: newCompany,
    });
  } catch (error) {
    console.error("❌ Error en registerCompany:", error);
    res.status(500).json({ message: "Error interno del servidor" });
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
      return res.json(user);
    }

    if (role === "COMPANY") {
      const company = await prisma.company.findUnique({ where: { id } });
      return res.json(company);
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

    if (role === "USER") {
      const updated = await prisma.user.update({ where: { id }, data });
      return res.json({ message: "Perfil de usuario actualizado", updated });
    }

    if (role === "COMPANY") {
      const updated = await prisma.company.update({ where: { id }, data });
      return res.json({ message: "Perfil de empresa actualizado", updated });
    }

    return res.status(400).json({ message: "Rol no válido" });
  } catch (error) {
    console.error("❌ Error actualizando perfil:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
