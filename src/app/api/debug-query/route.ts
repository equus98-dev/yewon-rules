import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const res = await pool.query(`SELECT id, "articleNumber", title, "contentText", "contentJson" FROM "Article" WHERE "revisionId" IN (SELECT id FROM "Revision" WHERE "ruleId" = '730c4edc-15a4-4df1-be7d-304bfa4dcfc9' ORDER BY version DESC LIMIT 1) AND "articleNumber" IN (61, 62, 63) ORDER BY "articleNumber"`);
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  } finally {
    pool.end();
  }
}
