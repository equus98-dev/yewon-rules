const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

pool.query(`SELECT id, part, chapter, section, "subSection", "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder" FROM "Article" LIMIT 1`)
  .then(res => console.log(res.rows))
  .catch(err => console.error(err.message))
  .finally(() => pool.end());
