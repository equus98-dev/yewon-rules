import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const res = await pool.query('SELECT "fileUrl", title FROM "Attachment" LIMIT 5');
  console.log(res.rows);
} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
