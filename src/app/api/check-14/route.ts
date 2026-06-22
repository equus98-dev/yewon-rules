import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const db = process.env.DB as any;
    
    const ruleRes = await db.prepare(`SELECT id FROM Rule WHERE ruleNumber = '5-1-2'`).first();
    if (!ruleRes) return NextResponse.json({ error: "Rule 5-1-2 not found" });

    const revRes = await db.prepare(`SELECT id FROM Revision WHERE ruleId = ? ORDER BY version DESC LIMIT 1`).bind(ruleRes.id).first();
    if (!revRes) return NextResponse.json({ error: "Revision not found" });

    const articles = await db.prepare(`SELECT id, articleNumber, title, contentText, contentJson FROM Article WHERE revisionId = ? ORDER BY articleNumber ASC`).bind(revRes.id).all();

    return NextResponse.json({ success: true, articles: articles.results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
