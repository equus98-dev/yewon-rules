export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();
    const res = await pool.query(`
      SELECT r.id, r.version, r."versionName", r."revisionType", r."createdAt"
      FROM "Revision" r
      JOIN "Rule" ru ON ru.id = r."ruleId"
      WHERE ru."ruleNumber" = '5-2-16'
      ORDER BY r."createdAt" ASC
    `);
    return NextResponse.json({ revisions: res.rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
