import { PrismaClient } from "@prisma/client/edge";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cloudflare Pages/Workers(Edge Runtime)를 위한 전용 Prisma Client 생성
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    try {
      // 정적 import를 배제하고 동적 require를 적용하여 빌드타임 node:util/types 에러를 원천 회피합니다.
      const { Pool } = require("pg");
      const { PrismaPg } = require("@prisma/adapter-pg");
      
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
    } catch (e) {
      console.error("Failed to initialize Prisma Edge Client with PG adapter:", e);
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

