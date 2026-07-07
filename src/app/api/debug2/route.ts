export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const res = await pool.query(`
      SELECT a.id, a."revisionId", a."articleNumber", a.title, a."contentText" 
      FROM "Article" a 
      JOIN "Revision" r ON a."revisionId" = r.id
      WHERE r."ruleId" = '526db4d2-bca1-49c2-a890-22541179286e' AND a."articleNumber" > 8000
      ORDER BY r.version DESC, a."articleNumber"
    `);
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  } finally {
    pool.end();
  }
}
