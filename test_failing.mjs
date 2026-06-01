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
  const targetRevisionId = 'SOME_REVISION_ID'; // Need to find it
  const id = '3c0558cc-0698-4cba-843b-44f417cc48b8'; // One of the failing rules
  
  console.log("Fetching revisions...");
  const revs = await pool.query(`SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`, [id]);
  if (revs.rows.length === 0) {
      console.log("No revisions found!");
      return;
  }
  const revId = revs.rows[0].id;
  console.log("Revision ID:", revId);
  
  console.time("Query comparisons");
  try {
      const res = await pool.query(
        `SELECT 
          ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note,
          ba.chapter AS "before_chapter", ba."articleNumber" AS "before_articleNumber",
          ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson",
          aa.chapter AS "after_chapter", aa."articleNumber" AS "after_articleNumber",
          aa.title AS "after_title", aa."contentText" AS "after_contentText", aa."contentJson" AS "after_contentJson"
         FROM "ArticleComparison" ac
         LEFT JOIN "Article" ba ON ac."beforeArticleId" = ba.id
         LEFT JOIN "Article" aa ON ac."afterArticleId" = aa.id
         WHERE ac."revisionId" = $1`,
        [revId]
      );
      console.log(`Found ${res.rows.length} comparisons.`);
  } catch (e) {
      console.error(e);
  }
  console.timeEnd("Query comparisons");
  pool.end();
}

run();
