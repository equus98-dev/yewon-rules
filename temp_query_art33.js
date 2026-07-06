const { createPool } = require('pg');
async function run() {
  const pool = createPool({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/yewon" });
  try {
    const res = await pool.query(`SELECT id, "articleNumber", title, "contentText", "contentHtml" FROM "Article" WHERE "articleNumber" = 33 ORDER BY "createdAt" DESC LIMIT 5`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run().catch(console.error);
