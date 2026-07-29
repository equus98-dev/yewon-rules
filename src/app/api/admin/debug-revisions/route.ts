import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const pool = createPool();
    const client = await pool.connect();
    
    // Find the rule
    const { rows: rules } = await client.query(
      `SELECT id, title FROM "Rule" WHERE title LIKE '%문화예술HRD연구소%'`
    );
    
    if (!rules || rules.length === 0) {
      return NextResponse.json({ success: false, message: "Rule not found" });
    }
    
    const rule = rules[0];
    
    // Find revisions
    const { rows: revisions } = await client.query(
      `SELECT * FROM "Revision" WHERE "ruleId" = $1 ORDER BY "enactmentDate" DESC, "createdAt" DESC`,
      [rule.id]
    );
    
    return NextResponse.json({ success: true, rule, revisions });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
