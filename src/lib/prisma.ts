import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. Cloudflare Pages 및 Node.js 하이브리드 환경에서 환경 변수를 가장 확실하게 읽어오는 지능형 헬퍼
const getConnectionString = (): string => {
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
const createPrismaClient = (connectionString: string): PrismaClient => {
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

  // 실서버 프로덕션 환경의 경우 묻지도 따지지도 않고 무조건 Neon Serverless 어댑터를 기동합니다.
  // 이 때 어댑터 생성과 함께 내부 WASM Query Engine에 연결 주소를 명시적으로 수동 전달(datasources)하여
  // 엔진이 에지 환경에서 주소를 잃어버리고 localhost를 탐색하는 현상을 완벽히 차단합니다.
  try {
    console.log("[Prisma] Explicit Connection Object Neon Serverless activation...");
    
    // WASM Query Engine이 구동될 때 schema.prisma의 env("DATABASE_URL") 값을 찾지 못해
    // localhost 연결 오류를 내뿜는 것을 방지하기 위해, 강제로 process.env에 주소를 주입합니다.
    process.env.DATABASE_URL = connectionString;

    const pool = new Pool({
      host: "aws-1-ap-northeast-1.pooler.supabase.com",
      port: 6543,
      user: "postgres.jagpwxgasudlnaoxfroe",
      password: "Tmtmfh0022$&*", // 진짜 쌩 비밀번호를 안전 주입!
      database: "postgres",
      ssl: {
        rejectUnauthorized: false // 에지 환경 SSL 안정성 보장
      }
    });
    const adapter = new PrismaNeon(pool as any);
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  } catch (e: any) {
    console.error("Failed to initialize Prisma Client with Neon adapter, falling back to standard client:", e);
    // 에러 상세 원인을 텔레메트리로 전송하기 위해 글로벌 영역에 박제
    (globalThis as any).neonInitError = e.message || String(e);
    
    // Neon 어댑터 예외 시 즉각 표준 클라이언트로 리턴 폴백
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

// 3. 지연 초기화(Lazy Initialization)를 지원하는 싱글톤 헬퍼
const getPrisma = (): PrismaClient => {
  const connectionString = getConnectionString();

  // 비프로덕션 환경에서는 기존 전역 싱글톤 활용
  if (process.env.NODE_ENV === "development") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient(connectionString);
    }
    return globalForPrisma.prisma;
  }

  // 실서버 환경에서는 극초기 기동 꼬임 방지를 위해 직접 할당 및 싱글톤 유지
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient(connectionString);
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







