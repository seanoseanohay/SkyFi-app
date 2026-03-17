import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}

/** Lazy-initialized so build (no DATABASE_URL) can complete; throws on first use if DATABASE_URL is missing. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    return (getPrisma() as unknown as Record<string, unknown>)[prop];
  },
});
