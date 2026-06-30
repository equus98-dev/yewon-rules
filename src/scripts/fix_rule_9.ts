import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const ruleId = '33b51799-7674-480f-93d2-95a400ea2e0c';
  
  const revRes = await client.query(`SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY "enactmentDate" DESC, "version" DESC`, [ruleId]);
  
  for (const rev of revRes.rows) {
    const revisionId = rev.id;

    const artsRes = await client.query(`SELECT id, "articleNumber", "contentText", "contentJson", "sortOrder" FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 9`, [revisionId]);
    if (artsRes.rows.length === 0) continue;

    const targetArticle = artsRes.rows[0];
    const text = String(targetArticle.contentText || "");

    if (text.includes("1. (시행일)")) {
      console.log("Found addendum in revision:", revisionId);
      const parts = text.split("1. (시행일)");
      const newArticle9Text = parts[0].trim();
      const addendumText = "부칙\n1. (시행일)" + parts.slice(1).join("1. (시행일)").trim();

      // Update Article 9
      const cJsonStr9 = JSON.stringify([{ type: "article", text: newArticle9Text }]);
      await client.query(`UPDATE "Article" SET "contentText" = $1, "contentJson" = $2 WHERE id = $3`, [newArticle9Text, cJsonStr9, targetArticle.id]);

      // Insert Addendum Article
      const nextSortOrder = targetArticle.sortOrder + 1;
      const cJsonAddendum = JSON.stringify(addendumText.split('\n').filter(Boolean).map((p: string) => ({ type: "paragraph", text: p })));
      await client.query(`
        INSERT INTO "Article" ("id", "revisionId", "articleNumber", title, chapter, section, "subSection", "contentText", "contentJson", "sortOrder", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 8000, '부칙', '부칙', '', '', $2, $3, $4, NOW(), NOW())
      `, [revisionId, addendumText, cJsonAddendum, nextSortOrder]);

      console.log("Fixed Article 9 and separated Addendum.");
    }
  }
  
  await client.end();
}
run().catch(console.error);
