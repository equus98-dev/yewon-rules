export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  let client;
  try {
    client = await pool.connect();
    
    // Find latest revision for 1-0-1
    const rev1Res = await client.query(`SELECT r.id, r.version FROM "Revision" r JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = '1-0-1' ORDER BY r.version DESC LIMIT 1`);
    if (rev1Res.rows[0] && rev1Res.rows[0].version > 1) {
      await client.query(`DELETE FROM "ArticleComparison" WHERE "revisionId" = $1`, [rev1Res.rows[0].id]);
      await client.query(`DELETE FROM "Article" WHERE "revisionId" = $1`, [rev1Res.rows[0].id]);
      await client.query(`DELETE FROM "Revision" WHERE id = $1`, [rev1Res.rows[0].id]);
    }

    // Find latest revision for 1-0-2
    const rev2Res = await client.query(`SELECT r.id, r.version FROM "Revision" r JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = '1-0-2' ORDER BY r.version DESC LIMIT 1`);
    if (rev2Res.rows[0] && rev2Res.rows[0].version > 1) {
      await client.query(`DELETE FROM "ArticleComparison" WHERE "revisionId" = $1`, [rev2Res.rows[0].id]);
      await client.query(`DELETE FROM "Article" WHERE "revisionId" = $1`, [rev2Res.rows[0].id]);
      await client.query(`DELETE FROM "Revision" WHERE id = $1`, [rev2Res.rows[0].id]);
    }

    return NextResponse.json({ success: true, message: "Fixed 1-0-1 and 1-0-2" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
