import { NextResponse } from "next/server";
import { getD1 } from "@/lib/db";

export async function GET() {
  try {
    const db = getD1();
    
    // Find '대학원 학칙' rule ID
    const ruleStmt = db.prepare("SELECT id FROM Rule WHERE name LIKE '%대학원 학칙%' LIMIT 1");
    const ruleRes = await ruleStmt.first();
    if (!ruleRes) return NextResponse.json({ error: "Rule not found" });

    // Find its current revision
    const revStmt = db.prepare("SELECT id FROM Revision WHERE ruleId = ? ORDER BY createdAt DESC LIMIT 1").bind(ruleRes.id);
    const revRes = await revStmt.first();
    if (!revRes) return NextResponse.json({ error: "Revision not found" });

    // Find addendums
    const stmt = db.prepare("SELECT id, articleNumber, title, contentJson FROM Article WHERE revisionId = ? AND articleNumber >= 8000 ORDER BY articleNumber ASC").bind(revRes.id);
    const { results } = await stmt.all();

    return NextResponse.json({ articles: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
