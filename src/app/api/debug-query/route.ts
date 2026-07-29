export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const res = await pool.query(`SELECT r.id as "ruleId", rev.id as "revisionId", rev.version, rev."revisionType", rev."enactmentDate" FROM "Rule" r JOIN "Revision" rev ON r.id = rev."ruleId" WHERE r."ruleNumber" = '5-2-16' ORDER BY rev.version DESC`);
    return NextResponse.json(res.rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  } finally {
    pool.end();
  }
}
