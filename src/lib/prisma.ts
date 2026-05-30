import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 6에서는 추가 드라이버 어댑터나 복잡한 생성자 인수 없이 
// 빈 인스턴스로 즉시 DATABASE_URL 환경 변수를 바인딩하여 작동합니다.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
