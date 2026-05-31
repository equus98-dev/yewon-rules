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
  
  // Supabase TCP connection pooler
  return "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
};

const createPrismaClient = (): PrismaClient => {
  const connectionString = getConnectionString();

  // 강제로 process.env 설정 (WASM 엔진용)
  process.env.DATABASE_URL = connectionString;

  try {
    console.log("[Prisma] Activating PG Adapter for Supabase...");
    // 지연 로딩(Lazy require)을 사용하여 Next.js 빌드 시 Edge Sandbox에서 발생하는 node:util/types 에러를 방지합니다.
    const { Pool } = require("pg");
    const { PrismaPg } = require("@prisma/adapter-pg");
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: ["error"] });
  } catch (e: any) {
    console.error("Failed to initialize Prisma Client with PG adapter:", e);
    (globalThis as any).neonInitError = e.message || String(e);
    
    return new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log: ["error"],
    });
  }
};

const getPrisma = (): PrismaClient => {
  if (process.env.NODE_ENV === "development") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});







