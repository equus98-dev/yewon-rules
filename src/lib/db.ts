import { Pool } from "@neondatabase/serverless";

const connectionString =
  "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

// Factory: create a fresh Pool per request (edge runtime has no persistent state)
// Always call pool.end() in a finally block after using the returned pool
export function createPool(): Pool {
  return new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
}
