import { PrismaClient, Role } from '../src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'rdroguetts';
  const adminPassword = await bcrypt.hash('961173', 10);

  // Create the admin user
  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
