import { Pool } from "@neondatabase/serverless";

const poolConfig = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.jagpwxgasudlnaoxfroe",
  password: "Tmtmfh0022$&*",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
};

// Singleton pool instance for Edge runtime
export const pool = new Pool(poolConfig);
