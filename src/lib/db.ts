import { Pool } from "@neondatabase/serverless";

const connectionString =
  "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

// Singleton pool - shared across all requests to avoid connection exhaustion
export const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
