export const runtime = "edge";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  let client;
  try {
    client = await pool.connect();
    const revRes = await client.query(`SELECT id FROM "Revision" WHERE "ruleId" = (SELECT id FROM "Rule" WHERE "ruleNumber" = '1-0-1') ORDER BY version DESC LIMIT 1`);
    if (!revRes.rows[0]) return NextResponse.json({ error: "No revision" });
    
    const artRes = await client.query(`SELECT "articleNumber", "contentJson", "contentHtml", "contentText" FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC LIMIT 5`, [revRes.rows[0].id]);
    
    return NextResponse.json({ articles: artRes.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  } finally {
    if (client) client.release();
  }
}
