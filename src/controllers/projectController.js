import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../database/prismaClient.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar en User o en Company
    const account =
      (await prisma.user.findUnique({ where: { email } })) ||
      (await prisma.company.findUnique({ where: { email } }));

    if (!account) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validar contraseña
    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: account.id, email: account.email, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Responder con token y datos del usuario
    return res.json({
      token,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
