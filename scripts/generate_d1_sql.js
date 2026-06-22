const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function run() {
  await client.connect();
  try {
    const revRes = await client.query(`
      SELECT rev.id 
      FROM "Revision" rev 
      JOIN "Rule" r ON rev."ruleId" = r.id 
      WHERE r.title LIKE '%사무분장%'
      ORDER BY rev.version DESC LIMIT 1
    `);
    const revisionId = revRes.rows[0].id;

    const res = await client.query(`
      SELECT id, part, chapter, section, "subSection", "articleNumber", title,
      "contentText", "contentJson", "sortOrder", "revisionId", "updatedAt"
      FROM "Article"
      WHERE "revisionId" = $1
      ORDER BY "sortOrder" ASC
    `, [revisionId]);

    let sql = `DELETE FROM "ArticleComparison" WHERE "revisionId" = '${revisionId}';\n`;
    sql += `DELETE FROM "Article" WHERE "revisionId" = '${revisionId}';\n`;

    for (const row of res.rows) {
      const escape = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return "'" + str.replace(/'/g, "''") + "'";
      };

      sql += `INSERT INTO "Article" (id, part, chapter, section, "subSection", "articleNumber", title, "contentText", "contentJson", "sortOrder", "revisionId", "updatedAt") VALUES (` +
        `${escape(row.id)}, ` +
        `${escape(row.part)}, ` +
        `${escape(row.chapter)}, ` +
        `${escape(row.section)}, ` +
        `${escape(row.subSection)}, ` +
        `${row.articleNumber}, ` +
        `${escape(row.title)}, ` +
        `${escape(row.contentText)}, ` +
        `${escape(typeof row.contentJson === 'string' ? row.contentJson : JSON.stringify(row.contentJson))}, ` +
        `${row.sortOrder}, ` +
        `${escape(row.revisionId)}, ` +
        `CURRENT_TIMESTAMP);\n`;
    }

    fs.writeFileSync('e:/예원예술대학교_규정관리시스템/sync_d1.sql', sql);
    console.log("Generated sync_d1.sql successfully.");

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
