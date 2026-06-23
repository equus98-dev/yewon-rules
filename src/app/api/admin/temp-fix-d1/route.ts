export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getD1 } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = getD1();
    
    // First, fetch the current revision of Rule 2-0-2
    const ruleRes = await db.prepare(`SELECT id FROM Rule WHERE ruleNumber = '2-0-2' LIMIT 1`).first();
    if (!ruleRes) return NextResponse.json({ error: "Rule not found" });

    const revRes = await db.prepare(`SELECT id FROM Revision WHERE ruleId = ? ORDER BY version DESC LIMIT 1`).bind(ruleRes.id).first();
    
    // Get ALL Articles for this revision
    const artRes = await db.prepare(`SELECT id, articleNumber, contentJson FROM Article WHERE revisionId = ? ORDER BY sortOrder ASC`).bind(revRes.id).all();
    
    let logs = [];
    
    for (const art of artRes.results) {
        if (!art.contentJson) continue;
        let cJson = JSON.parse(art.contentJson as string);
        let changed = false;

        // Fix Article 3 spaces
        if (art.articleNumber === 3 && cJson[0] && cJson[0].text && cJson[0].text.includes('교양학부')) {
            let oldText = cJson[0].text;
            let newText = oldText.replace(/,/g, ", ").replace(/, \s+/g, ", ");
            if (oldText !== newText) {
                cJson[0].text = newText;
                changed = true;
            }
        }
        
        // Fix nested parenthesis parsing error for any article
        const text = cJson[0]?.text;
        const num = cJson[0]?.num;
        if (text && text.includes('①') && !text.startsWith('①')) {
          const match = text.match(/^([^①]+)(①.*)/);
          if (match) {
              const restOfTitle = match[1];
              const newText = match[2];
              const newNum = (num + restOfTitle).replace(/\s+/g, ' ').trim();
              cJson[0].num = newNum;
              cJson[0].text = newText;
              changed = true;
          }
        }
        
        if (changed) {
            await db.prepare(`UPDATE Article SET contentJson = ? WHERE id = ?`).bind(JSON.stringify(cJson), art.id).run();
            logs.push(`Fixed Article ${art.articleNumber} (id: ${art.id})`);
        }
    }

    if (logs.length === 0) logs.push("No articles needed fixing.");
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
