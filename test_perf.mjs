import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  const id = '3c0558cc-0698-4cba-843b-44f417cc48b8'; 
  
  console.time("Revision Query");
  const revs = await pool.query(`EXPLAIN ANALYZE SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`, [id]);
  console.timeEnd("Revision Query");
  console.log(revs.rows);
  
  const revId = 'f759e16c-41b4-4e39-959b-de50bf57d4bc'; // from earlier
  
  console.time("Article Query");
  const articles = await pool.query(`EXPLAIN ANALYZE SELECT id FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`, [revId]);
  console.timeEnd("Article Query");
  console.log(articles.rows);
  
  pool.end();
}

run();
