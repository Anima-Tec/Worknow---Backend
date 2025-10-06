import { prisma } from "./database/prismaClient.js"; 
import bcrypt from "bcryptjs";

async function main() {
  // buscamos el usuario de prueba
  const account = await prisma.company.findUnique({
    where: { email: "company@worknow.com" },
  });

  if (!account) {
    console.log("❌ No se encontró la cuenta company@worknow.com");
    return;
  }

  console.log("👉 Email:", account.email);
  console.log("👉 Hash en DB:", account.password);

  // comparamos el password plano con el hash
  const valid = await bcrypt.compare("123456", account.password);

  console.log("👉 Resultado bcrypt.compare con '123456':", valid);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
