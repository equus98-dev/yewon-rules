export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();
    // Get the latest revision of rule 1-0-1
    const revRes = await pool.query(`
      SELECT id FROM "Revision" 
      WHERE "ruleId" = (SELECT id FROM "Rule" WHERE "ruleNumber" = '1-0-1') 
      ORDER BY version DESC LIMIT 1
    `);
    
    if (!revRes.rows[0]) return NextResponse.json({ error: "No revision" });
    
    // Get the last article of that revision (where Addendum is attached)
    const artRes = await pool.query(`
      SELECT "articleNumber", title, "contentHtml", "contentText" 
      FROM "Article" 
      WHERE "revisionId" = $1 
      ORDER BY "sortOrder" DESC LIMIT 3
    `, [revRes.rows[0].id]);
    
    return NextResponse.json({ articles: artRes.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
