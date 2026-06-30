import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();

    // 1. 국내외 대학 간 학점교류 운영세칙 규정 찾기
    const rulesRes = await pool.query(`SELECT id, "currentRevisionId" FROM "Rule" WHERE title LIKE '%국내외 대학 간 학점교류 운영세칙%'`);
    if (rulesRes.rows.length === 0) {
      return NextResponse.json({ message: "Rule not found" });
    }

    const ruleId = rulesRes.rows[0].id;
    const revisionId = rulesRes.rows[0].currentRevisionId;

    // 2. 제9조 조회
    const artsRes = await pool.query(`SELECT id, "articleNumber", "contentText", "contentJson", "sortOrder" FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 9`, [revisionId]);
    if (artsRes.rows.length === 0) {
      return NextResponse.json({ message: "Article 9 not found" });
    }

    const targetArticle = artsRes.rows[0];
    const text = String(targetArticle.contentText || "");

    let result: any = { ruleId, revisionId };

    if (text.includes("부칙")) {
      const parts = text.split("부칙");
      const newArticle9Text = parts[0].trim();
      const addendumText = "부칙\n" + parts.slice(1).join("부칙").trim();

      // Update Article 9
      const cJsonStr9 = JSON.stringify([{ type: "article", text: newArticle9Text }]);
      await pool.query(`UPDATE "Article" SET "contentText" = $1, "contentJson" = $2 WHERE id = $3`, [newArticle9Text, cJsonStr9, targetArticle.id]);

      // Insert Addendum Article
      const nextSortOrder = targetArticle.sortOrder + 1;
      const cJsonAddendum = JSON.stringify(addendumText.split('\n').filter(Boolean).map(p => ({ type: "paragraph", text: p })));
      await pool.query(`
        INSERT INTO "Article" ("revisionId", "articleNumber", title, chapter, section, "subSection", "contentText", "contentJson", "sortOrder", "createdAt", "updatedAt")
        VALUES ($1, 8000, '부칙', '부칙', '', '', $2, $3, $4, NOW(), NOW())
      `, [revisionId, addendumText, cJsonAddendum, nextSortOrder]);

      result.fixed = true;
      result.newArticle9Text = newArticle9Text;
      result.addendumText = addendumText;
    } else {
      result.message = "No addendum found inside Article 9";
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
