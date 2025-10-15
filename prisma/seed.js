import { prisma } from "../src/database/prismaClient.js";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = bcrypt.hashSync("123456", 10);

  // 🔹 Crear o actualizar una empresa
  await prisma.company.upsert({
    where: { email: "company@worknow.com" },
    update: {},
    create: {
      nombreEmpresa: "WorkNow S.A.",
      email: "company@worknow.com",
      password: hashedPassword,
      role: "COMPANY",
      telefono: "099999999",
      direccion: "Av. Rivera 1234",
      ciudad: "Montevideo",
      sector: "Tecnología",
      sitioWeb: "http://worknow.com",
      tamano: "11-50 empleados"
    },
  });

  // 🔹 Crear o actualizar un usuario
  await prisma.user.upsert({
    where: { email: "user@worknow.com" },
    update: {},
    create: {
      nombre: "Juan",
      apellido: "Pérez",
      email: "user@worknow.com",
      password: hashedPassword,
      role: "USER",
      telefono: "091234567",
      ciudad: "Montevideo",
      profesion: "Desarrollador",
    },
  });
}

main()
  .then(() => console.log("✅ Empresa y Usuario creados con contraseña 123456"))
  .catch((e) => {
    console.error("❌ Error al ejecutar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
