import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, reuse the same client across invocations (Vercel)
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
} else {
  // In dev, always create a new client for hot-reloading issues
  prisma = new PrismaClient();
}

export default prisma;
