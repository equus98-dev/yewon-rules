import { Pool } from "@neondatabase/serverless";

const poolConfig = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.jagpwxgasudlnaoxfroe",
  password: "Tmtmfh0022$&*",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const pool = new Pool(poolConfig);
  try {
    const res = await pool.query(`SELECT id FROM "Rule" LIMIT 1`);
    console.log(res.rows[0].id);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
