import { PrismaClient } from "@prisma/client";

// Prevents exhausting Neon's connection limit from hot-reload in dev,
// and keeps every module using the same client instance.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
