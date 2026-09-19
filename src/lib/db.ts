import { PrismaClient } from '@prisma/client';
import path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./db/custom.db';
  if (envUrl.startsWith('file:')) {
    const dbFile = path.basename(envUrl.replace(/^file:/, '')) || 'custom.db';
    const absPath = path.join(process.cwd(), 'db', dbFile).replace(/\\/g, '/');
    return `file:${absPath}`;
  }
  return envUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;