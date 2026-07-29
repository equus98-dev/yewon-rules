export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const pool = createPool();
    const client = await pool.connect();
    
    // Find rule 5-2-16
    const { rows: rules } = await client.query(
      `SELECT id FROM "Rule" WHERE "ruleNumber" = '5-2-16'`
    );
    if (rules.length === 0) return NextResponse.json({ error: "Rule not found" });
    
    // Find revision
    const { rows: revisions } = await client.query(
      `SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`,
      [rules[0].id]
    );
    
    // Find article 4
    const { rows: articles } = await client.query(
      `SELECT id, "contentText" FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 4`,
      [revisions[0].id]
    );
    
    return NextResponse.json({ article: articles[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
