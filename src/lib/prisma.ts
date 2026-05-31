import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. Cloudflare Pages 및 Node.js 하이브리드 환경에서 환경 변수를 가장 확실하게 읽어오는 지능형 헬퍼
const getConnectionString = (): string | undefined => {
  // 입력된 문자열 주소가 유효한 postgresql 포맷인지 정밀 검사하는 헬퍼
  const checkUrl = (url: any): boolean => {
    return typeof url === "string" && url.trim().startsWith("postgresql://");
  };

  // A. 일반 환경 변수 확인 및 정규화
  if (checkUrl(process.env.DATABASE_URL)) {
    return process.env.DATABASE_URL!.trim();
  }
  
  // B. Cloudflare Global Scope 바인딩 확인
  const g = globalThis as any;
  if (checkUrl(g.DATABASE_URL)) {
    return g.DATABASE_URL.trim();
  }
  if (g.env && checkUrl(g.env.DATABASE_URL)) {
    return g.env.DATABASE_URL.trim();
  }
  
  // C. 전역 식별자 최종 확인 (TypeScript 컴파일 에러 방지를 위한 동적 프로퍼티 안전 참조)
  try {
    const gRef = globalThis as any;
    if (checkUrl(gRef.DATABASE_URL)) {
      return gRef.DATABASE_URL.trim();
    }
  } catch (e) {}
  
  // D. [최종 안전장치] 플랫폼 환경변수 유실 및 포맷 손상 시를 위한 고정 Supabase 클라우드 직접 폴백
  return "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
};

// 2. Prisma Client의 생성 로직
const createPrismaClient = (connectionString: string | undefined): PrismaClient => {
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

  // 오직 실서버 프로덕션 환경(production)에서만 Neon Serverless 어댑터를 기동합니다.
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction && connectionString) {
    try {
      console.log("[Prisma] Production environment detected. Enabling Neon Serverless adapter...");
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool as any);
      return new PrismaClient({
        adapter,
        log: ["error"],
      });
    } catch (e) {
      console.error("Failed to initialize Prisma Client with Neon adapter, falling back to standard client:", e);
      // [대량 방어코드] Neon 어댑터 초기화 도중 예외가 발생하더라도 함수가 undefined를 반환해 평생 에러를 유발하는 버그를 차단하고,
      // 즉시 내장된 주소로 표준 PrismaClient를 빌드하여 반환합니다.
      return new PrismaClient({
        datasources: {
          db: {
            url: connectionString,
          },
        },
        log: ["error"],
      });
    }
  }

  // 로컬 빌드 혹은 에지가 아닌 서버사이드 렌더링 시점에 대비한 기본 인스턴스화
  return new PrismaClient({
    datasources: connectionString ? {
      db: {
        url: connectionString,
      },
    } : undefined,
    log: ["error"],
  });
};

// 3. 지연 초기화(Lazy Initialization)를 지원하는 싱글톤 헬퍼
const getPrisma = (): PrismaClient => {
  const connectionString = getConnectionString();

  // 비프로덕션 환경에서는 기존 전역 싱글톤 활용
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient(connectionString);
    }
    return globalForPrisma.prisma;
  }

  // 프로덕션 에지 런타임의 경우:
  // 최초 앱 탑레벨 모듈 로드 시점에는 환경변수 바인딩이 아직 완성되지 않아 undefined 상태로 캐싱될 위험이 있습니다.
  // 따라서 connectionString이 주입되기 전까지는 전역 싱글톤 캐시에 저장하지 않고, 
  // 매 요청 시점에 완전한 환경변수가 수립되었을 때에만 딱 1회 올바르게 인스턴스를 캐싱합니다.
  if (!connectionString) {
    return createPrismaClient(undefined);
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient(connectionString);
  } else {
    // 혹시 모를 이전의 불완전 캐시 갱신 (Neon 어댑터 누락 방지)
    const client = globalForPrisma.prisma as any;
    const isProduction = process.env.NODE_ENV === "production";
    const hasNeonAdapter = client._engineConfig?.activeProvider === "postgres" && !!client._engineConfig?.adapter;
    
    if (isProduction && !hasNeonAdapter) {
      globalForPrisma.prisma = createPrismaClient(connectionString);
    }
  }

  return globalForPrisma.prisma;
};

// 4. 프록시(Proxy)를 통해 모듈 탑레벨 로드 시점의 빈 환경변수 캐싱을 원천 차단하고,
//    실제 DB 쿼리가 시작되는 런타임 시점에 데이터베이스 연결을 온전하게 확립(Lazy proxy)
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




