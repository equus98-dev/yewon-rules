import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Article'`);
    console.log(res.rows);

    // Try a dummy insert
    await client.query("BEGIN");
    
    const revRes = await client.query(`SELECT id FROM "Revision" LIMIT 1`);
    if (revRes.rows.length > 0) {
      const revId = revRes.rows[0].id;
      await client.query(
          `INSERT INTO "Article" (id, "revisionId", chapter, section, "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          ['test-id', revId, 'ch1', 'sec1', 999, 'title', JSON.stringify({}), 'text', 1]
      );
      console.log('Insert successful');
    } else {
      console.log('No revision found to test insert');
    }
    await client.query("ROLLBACK");
  } catch (err) {
    console.error('Error:', err);
    await client.query("ROLLBACK");
  } finally {
    client.release();
    pool.end();
  }
}

main();
