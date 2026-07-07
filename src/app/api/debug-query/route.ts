export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const revisionsRes = await pool.query(
      `SELECT id, version, "versionName", "enactmentDate" FROM "Revision" WHERE "ruleId" = '526db4d2-bca1-49c2-a890-22541179286e' ORDER BY version DESC`
    );
    
    if (revisionsRes.rows.length === 0) {
      return NextResponse.json({ error: "No revisions found" });
    }
    
    const newRev = revisionsRes.rows[0]; // version 2
    const oldRev = revisionsRes.rows[1]; // version 1
    
    // 1. Fix old revision's addendum (version 1)
    await pool.query(
      `UPDATE "Article" 
       SET "contentText" = '1. (시행일) 이 규정은 2025년 12월 09일부터 시행한다.',
           "contentJson" = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. (시행일) 이 규정은 2025년 12월 09일부터 시행한다."}]}]}'
       WHERE "revisionId" = $1 AND "articleNumber" = 8000`,
      [oldRev.id]
    );
    
    // 2. Add missing addendum to new revision (version 2)
    // Check if it already exists
    const checkRes = await pool.query(
      `SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 8000`,
      [newRev.id]
    );
    
    let inserted = false;
    if (checkRes.rows.length === 0) {
      const crypto = require('crypto');
      const articleId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "Article" (id, "revisionId", "articleNumber", title, "contentText", "contentJson", "createdAt", "updatedAt") 
         VALUES ($1, $2, 8000, '부칙(2026. 6. 17)', '1. (시행일) 이 규정은 2026년 6월 17일부터 시행한다.', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. (시행일) 이 규정은 2026년 6월 17일부터 시행한다."}]}]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [articleId, newRev.id]
      );
      inserted = true;
    }
    
    return NextResponse.json({
      success: true,
      oldRevFixed: oldRev.id,
      newRevMissingAddendumInserted: inserted,
      newRevId: newRev.id
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  } finally {
    pool.end();
  }
}
