export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const revisionsRes = await pool.query(
      `SELECT id, version FROM "Revision" WHERE "ruleId" = '526db4d2-bca1-49c2-a890-22541179286e' ORDER BY version DESC`
    );
    
    const newRev = revisionsRes.rows[0]; // version 2 (2026-06-17)
    
    // 1. Fix the old addendum (2025.12.09) in ALL revisions so it's identical and clean
    const oldTitle = "부칙(2025. 12. 09)";
    const oldText = "1. (시행일) 이 규정은 2025년 12월 09일부터 시행한다.";
    const oldHtml = "<p>1. (시행일) 이 규정은 2025년 12월 09일부터 시행한다.</p>";
    const oldJson = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. (시행일) 이 규정은 2025년 12월 09일부터 시행한다."}]}]}';

    for (const rev of revisionsRes.rows) {
      await pool.query(
        `UPDATE "Article" 
         SET title = $1, "contentText" = $2, "contentHtml" = $3, "contentJson" = $4
         WHERE "revisionId" = $5 AND "articleNumber" = 8000`,
        [oldTitle, oldText, oldHtml, oldJson, rev.id]
      );
    }
    
    // 2. Ensure new addendum (2026.06.17) exists in the NEW revision ONLY (articleNumber 8001)
    const checkRes = await pool.query(
      `SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 8001`,
      [newRev.id]
    );
    
    if (checkRes.rows.length === 0) {
      const articleId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "Article" (id, "revisionId", "articleNumber", title, "contentText", "contentHtml", "contentJson", "createdAt", "updatedAt") 
         VALUES ($1, $2, 8001, '부칙(2026. 6. 17)', '1. (시행일) 이 규정은 2026년 6월 17일부터 시행한다.', '<p>1. (시행일) 이 규정은 2026년 6월 17일부터 시행한다.</p>', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. (시행일) 이 규정은 2026년 6월 17일부터 시행한다."}]}]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [articleId, newRev.id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  } finally {
    pool.end();
  }
}
