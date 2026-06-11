const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

pool.query(`SELECT 
        ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note,
        ba.part AS "before_part", ba.chapter AS "before_chapter", ba.section AS "before_section", ba."subSection" AS "before_subSection", ba."articleNumber" AS "before_articleNumber",
        ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson",
        aa.part AS "after_part", aa.chapter AS "after_chapter", aa.section AS "after_section", aa."subSection" AS "after_subSection", aa."articleNumber" AS "after_articleNumber",
        aa.title AS "after_title", aa."contentText" AS "after_contentText", aa."contentJson" AS "after_contentJson"
       FROM "ArticleComparison" ac
       LEFT JOIN "Article" ba ON ac."beforeArticleId" = ba.id
       LEFT JOIN "Article" aa ON ac."afterArticleId" = aa.id
       LIMIT 1`)
  .then(res => console.log(res.rows))
  .catch(err => console.error(err.message))
  .finally(() => pool.end());
