//para poder proar en postman los usuarios
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // contraseña en texto plano
  const plainPassword = '123456';

  // generamos el hash
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // crear usuario
  await prisma.user.create({
    data: {
      email: 'user@worknow.com',
      password: hashedPassword,
      role: 'USER'
    }
  });

  // crear empresa
  await prisma.company.create({
    data: {
      email: 'company@worknow.com',
      password: hashedPassword,
      role: 'COMPANY'
    }
  });

  console.log('✅ Usuarios creados:');
  console.log('- user@worknow.com / 123456');
  console.log('- company@worknow.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
