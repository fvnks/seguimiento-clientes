import { PrismaClient } from '@prisma/client';

// Construct the database URL from individual environment variables
if (process.env.DATABASE_USER && process.env.DATABASE_PASSWORD && process.env.DATABASE_HOST && process.env.DATABASE_PORT && process.env.DATABASE_NAME) {
  process.env.DATABASE_URL = `mysql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
}

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;