import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();
    
    // Find the rule
    const ruleRes = await pool.query(`SELECT id, title FROM "Rule" WHERE title LIKE '%통합예술치유연구소%'`);
    const rule = ruleRes.rows[0];
    
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    
    // Find its first revision
    const revRes = await pool.query(`SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version ASC LIMIT 1`, [rule.id]);
    const rev = revRes.rows[0];
    
    if (!rev) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }
    
    // Update attachments
    const updateRes = await pool.query(`
      UPDATE "Attachment" 
      SET "revisionId" = $1, title = '[전문] ' || title 
      WHERE "ruleId" = $2 AND title NOT LIKE '%[전문]%'
    `, [rev.id, rule.id]);
    
    return NextResponse.json({ success: true, updated: updateRes.rowCount || "done", ruleId: rule.id, revisionId: rev.id });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
