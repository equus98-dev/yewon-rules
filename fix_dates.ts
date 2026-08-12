import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      UPDATE "Revision"
      SET 
        "versionName" = '2026. 7. 22. (제정)',
        "enactmentDate" = '2026-07-22',
        "effectiveDate" = '2026-07-22'
      WHERE "versionName" = '2026. 7. 29. (제정)'
        AND "revisionType" = 'ENACTMENT'
        AND version = 1;
    `);
    console.log(`Updated ${res.rowCount} rows.`);
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
