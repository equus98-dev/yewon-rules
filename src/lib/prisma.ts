import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cloudflare Pages/Workers(Edge Runtime)를 위한 전용 Prisma Client 생성
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    try {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool as any);
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
    } catch (e) {
      console.error("Failed to initialize Prisma Client with Neon adapter:", e);
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

