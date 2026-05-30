import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Edge/Serverless 환경을 위한 Driver Adapter 기반 Prisma Client 생성
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    try {
      // Turbopack Edge 컴파일러의 eval 차단을 우회하기 위해 globalThis["require"] 사용
      const req = (globalThis as any)["require"];
      if (typeof req === "function") {
        const { Pool } = req("pg");
        const { PrismaPg } = req("@prisma/adapter-pg");
        
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({
          adapter,
          log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
      }
    } catch (e) {
      console.warn("Failed to initialize edge adapter, falling back to standard client:", e);
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
