import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 표준 Node.js 환경 및 다양한 배포 런타임 호환을 위한 Prisma Client 생성
const createPrismaClient = () => {
  // Edge/Wasm 환경과의 최소한의 하이브리드 호환을 보장하되, 표준 Rust 쿼리 엔진을 기본 채택하여 안정성 확보
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (e) {
    console.error("Failed to initialize standard Prisma Client:", e);
    // 폴백 기본 클라이언트 반환
    return new PrismaClient();
  }
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

