import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../database/prismaClient.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar en User o Company
    const account =
      (await prisma.user.findUnique({ where: { email } })) ||
      (await prisma.company.findUnique({ where: { email } }));

    if (!account) {
      console.log("❌ Usuario no encontrado:", email);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Depuración útil
    console.log("👉 Email recibido:", email);
    console.log("👉 Password recibido:", password);
    console.log("👉 Hash en DB:", account.password);

    // Comparar bcrypt
    const valid = await bcrypt.compare(password, account.password);
    console.log("👉 Resultado bcrypt.compare:", valid);

    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Firmar JWT (MISMO secreto que usarás en el verify)
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
