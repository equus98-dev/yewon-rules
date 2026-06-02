import { Pool, neonConfig } from "@neondatabase/serverless";

// Enable HTTP-based pool queries for Cloudflare Edge Runtime
// This avoids WebSocket/TCP handshake issues in edge environments
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchConnectionCache = true;

const connectionString =
  "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

// Singleton pool - uses HTTP fetch in edge runtime with poolQueryViaFetch=true
export const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
