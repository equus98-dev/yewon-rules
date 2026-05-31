import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cloudflare Pages/Workers(Edge Runtime)와 로컬 Node.js 하이브리드 구동을 위한 Prisma Client 생성
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  // 에지 런타임 환경 감지
  const isEdge = process.env.NEXT_RUNTIME === "edge";
  
  if (isEdge && connectionString) {
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

  // 로컬 개발 서버 등 일반 Node.js 런타임에서는 표준 Prisma Client를 구동하여 완벽한 안정성을 보장합니다.
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

