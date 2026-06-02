import { Pool } from "@neondatabase/serverless";

const connectionString =
  "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

const globalForNeon = global as unknown as { neonPool: Pool };

const _pool = globalForNeon.neonPool || new Pool({ 
  connectionString, 
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== "production") globalForNeon.neonPool = _pool;

// Factory: returns a wrapper around the global pool so we don't leak connections.
// It intercepts pool.end() to prevent destroying the global pool.
export function createPool(): Pool {
  return {
    query: (...args: any[]) => (_pool.query as any)(...args),
    connect: () => _pool.connect(),
    on: (...args: any[]) => (_pool.on as any)(...args),
    end: async () => { /* DO NOTHING to keep connection alive across edge requests */ },
  } as unknown as Pool;
}
