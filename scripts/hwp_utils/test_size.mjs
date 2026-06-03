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
  
  const revs = await pool.query(`SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`, [id]);
  const revId = revs.rows[0].id;
  
  const articles = await pool.query(`SELECT id, "contentJson", length("contentText") as text_len FROM "Article" WHERE "revisionId" = $1`, [revId]);
  console.log(`Found ${articles.rows.length} articles.`);
  
  let totalSize = 0;
  for (let a of articles.rows) {
      if (a.contentJson) totalSize += JSON.stringify(a.contentJson).length;
      if (a.text_len) totalSize += a.text_len;
  }
  console.log("Total size roughly:", totalSize, "bytes");
  
  pool.end();
}

run();
