export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool: any;
  try {
    pool = createPool();
    console.log("[Admin API] Starting deletion for rules 3-5-5-1 and 3-5-4-1 in Cloudflare D1...");

    const targetRuleNumbers = ['3-5-5-1', '3-5-4-1'];

    // 1. Select target rule IDs
    const ruleRes = await pool.query(`SELECT id, title, "ruleNumber" FROM "Rule" WHERE "ruleNumber" IN ('3-5-5-1', '3-5-4-1')`);
    const targetRules = ruleRes.rows;

    if (targetRules.length === 0) {
      return NextResponse.json({ message: "Rules already deleted or not found in D1", targetRuleNumbers });
    }

    const ids = targetRules.map((r: any) => r.id);
    const idListSql = ids.map((id: string) => `'${id}'`).join(',');

    // 2. Select revision IDs
    const revRes = await pool.query(`SELECT id FROM "Revision" WHERE "ruleId" IN (${idListSql})`);
    const revIds = revRes.rows.map((r: any) => r.id);
    const revListSql = revIds.length > 0 ? revIds.map((id: string) => `'${id}'`).join(',') : "''";

    // 3. Delete Article
    const artDel = await pool.query(`DELETE FROM "Article" WHERE "revisionId" IN (${revListSql})`);

    // 4. Delete Attachment
    const attDel = await pool.query(`DELETE FROM "Attachment" WHERE "ruleId" IN (${idListSql})`);

    // 5. Delete Revision
    const revDel = await pool.query(`DELETE FROM "Revision" WHERE "ruleId" IN (${idListSql})`);

    // 6. Delete Rule
    const ruleDel = await pool.query(`DELETE FROM "Rule" WHERE id IN (${idListSql})`);

    return NextResponse.json({
      success: true,
      message: "Successfully deleted target rules from Cloudflare D1 database",
      deletedRules: targetRules,
      deletedArticleCount: artDel.rowCount,
      deletedAttachmentCount: attDel.rowCount,
      deletedRevisionCount: revDel.rowCount,
      deletedRuleCount: ruleDel.rowCount,
    });
  } catch (error: any) {
    console.error("[Admin API Delete Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
