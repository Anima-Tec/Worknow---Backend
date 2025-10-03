import { prisma } from "../src/database/prismaClient.js";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = bcrypt.hashSync("123456", 10);

  await prisma.company.create({
    data: {
      email: "company@worknow.com",
      password: hashedPassword,
      role: "COMPANY",
    },
  });

  await prisma.user.create({
    data: {
      email: "user@worknow.com",
      password: hashedPassword,
      role: "USER",
    },
  });
}

main()
  .then(() => {
    console.log("Empresa y Usuario creados con email y password = 123456");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
