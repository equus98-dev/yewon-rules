import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cloudflare Pages/Workers(Edge Runtime)와 로컬 Node.js 하이브리드 구동을 위한 Prisma Client 생성
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // 로컬 개발 환경(development)인 경우, Next.js의 Edge 런타임 에뮬레이터 상에서도
  // Prisma가 에지 제한 에러를 내지 않고 표준 TCP 소켓으로 Supabase에 접속할 수 있도록 우회합니다.
  if (process.env.NODE_ENV === "development") {
    const tempRuntime = process.env.NEXT_RUNTIME;
    try {
      // 임시로 에지 런타임 표시자를 지워 일반 Node.js 클라이언트로 동작하게 유도합니다.
      delete process.env.NEXT_RUNTIME;
      
      const client = new PrismaClient({
        log: ["query", "error", "warn"],
      });
      
      if (tempRuntime) {
        process.env.NEXT_RUNTIME = tempRuntime;
      }
      return client;
    } catch (e) {
      if (tempRuntime) {
        process.env.NEXT_RUNTIME = tempRuntime;
      }
      console.error("Failed to initialize standard local Prisma Client:", e);
    }
  }

  // 오직 실서버 프로덕션 에지 런타임 환경에서만 Neon Serverless 어댑터를 기동합니다.
  const isProdEdge = process.env.NODE_ENV === "production" && process.env.NEXT_RUNTIME === "edge";
  
  if (isProdEdge && connectionString) {
    try {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool as any);
      return new PrismaClient({
        adapter,
        log: ["error"],
      });
    } catch (e) {
      console.error("Failed to initialize Prisma Client with Neon adapter:", e);
    }
  }

  // 기본 반환
  return new PrismaClient({
    log: ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

