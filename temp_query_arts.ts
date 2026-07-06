import { createPool } from '@vercel/postgres';
async function run() {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });
  try {
    const res = await pool.query(`SELECT id, "articleNumber", title, "contentText", "contentJson" FROM "Article" WHERE "articleNumber" IN (61, 62, 63) ORDER BY "createdAt" DESC LIMIT 10`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run().catch(console.error);
