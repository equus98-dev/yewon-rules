export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool;
  let client;
  try {
    pool = createPool();
    client = await pool.connect();
    
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
      `SELECT id, "contentText", "contentJson" FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 4`,
      [revisions[0].id]
    );
    
    if (articles.length === 0) return NextResponse.json({ error: "Article not found" });

    const article = articles[0];
    
    // The new contentText
    const newContentText = `제4조(임원)\n① 연구소의 사업과 운영을 원활하게하기 위하여 다음의 기구를 둔다.\n가) 소장 1인\n나) 간사 1인\n다) 자문위원\n라) 직무 교수 4인\n② 소장은 총장이 임명하고 그 임기는 2년으로 한다.\n③ 간사는 소장이 임명하며 그 임기는 2년으로 한다.\n④ 소장은 교내외 관련 분야의 전문가 중에서 연구위원 및 자문위원을 둘 수 있으며 그 임기는 1년으로 한다.\n<table class="custom-rule-table">\n<tr><td>&lt;예술치료사 참여인력 자격기준&gt;※ 2개 기준을 모두 충족해야 함</td></tr>\n<tr><td>1. 예술치료 관련 자격증(1급) 소지자<br>- 지원하는 분야에 해당하는 치료사 자격증 필수(예. 미술의 경우, 미술치료 관련 자격증)<br>2. 관련 분야 석사이상<br>3. 관련 분야 2년 이상 경력</td></tr>\n</table>`;

    // Also update contentJson if needed. Usually the UI falls back to contentText if we don't change contentJson, but it's better to update it.
    let newJson = typeof article.contentJson === 'string' ? JSON.parse(article.contentJson) : article.contentJson;
    newJson.contentText = newContentText;
    
    await client.query(`UPDATE "Article" SET "contentText" = $1, "contentJson" = $2 WHERE id = $3`, [newContentText, JSON.stringify(newJson), article.id]);
    
    return NextResponse.json({ success: true, old: article.contentText, new: newContentText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  } finally {
    if (client) client.release();
  }
}
