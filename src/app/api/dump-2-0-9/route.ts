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
    
    if (revisionsRes.rows.length === 0) {
      return NextResponse.json({ error: "No revisions found" });
    }
    
    const articlesRes = await pool.query(
      `SELECT id, "revisionId", "articleNumber", title, length("contentText") as len, "contentText" FROM "Article" WHERE "revisionId" IN (SELECT id FROM "Revision" WHERE "ruleId" = '526db4d2-bca1-49c2-a890-22541179286e') AND "articleNumber" > 1000 ORDER BY "revisionId", "articleNumber"`
    );
    
    return NextResponse.json({
      revisions: revisionsRes.rows,
      articles: articlesRes.rows
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  } finally {
    pool.end();
  }
}
