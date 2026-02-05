import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb(
  {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    connectionLimit: 5,
  },
  {
    database: 'royals',
  },
);

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
