import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getConnectionString = (): string => {
  const checkUrl = (url: any): boolean => {
    return typeof url === "string" && url.trim().startsWith("postgresql://");
  };

  if (checkUrl(process.env.DATABASE_URL)) return process.env.DATABASE_URL!.trim();
  
  const g = globalThis as any;
  if (checkUrl(g.DATABASE_URL)) return g.DATABASE_URL.trim();
  if (g.env && checkUrl(g.env.DATABASE_URL)) return g.env.DATABASE_URL.trim();
  
  try {
    const gRef = globalThis as any;
    if (checkUrl(gRef.DATABASE_URL)) return gRef.DATABASE_URL.trim();
  } catch (e) {}
  
  return "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
};

// 동적 로딩을 통한 Prisma Client 초기화 함수
export const getPrisma = async (): Promise<PrismaClient> => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = getConnectionString();
  process.env.DATABASE_URL = connectionString;

  try {
    console.log("[Prisma] Activating PG Adapter with dynamic import...");
    // 동적 import()를 사용하여 Next.js 빌드 시 모듈 평가 단계에서 node:util/types가 호출되는 것을 완벽히 방지합니다.
    const pgModule = await import("pg");
    const adapterPgModule = await import("@prisma/adapter-pg");
    
    // Pool은 ES 모듈일 수도 있고 CommonJS일 수도 있으므로 확인합니다.
    const Pool = pgModule.Pool || (pgModule as any).default?.Pool;
    const PrismaPg = adapterPgModule.PrismaPg;
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ["error"] });
    return globalForPrisma.prisma;
  } catch (e: any) {
    console.error("Failed to initialize Prisma Client with PG adapter:", e);
    throw new Error(`Prisma Adapter Init Error: ${e.message || String(e)}`);
  }
};
