import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const pool = createPool();
    const client = await pool.connect();
    
    // Find all rules
    const { rows: rules } = await client.query(
      `SELECT id, title FROM "Rule"`
    );
    
    let mergedCount = 0;
    
    for (const rule of rules) {
      // Find revisions for this rule
      const { rows: revisions } = await client.query(
        `SELECT * FROM "Revision" WHERE "ruleId" = $1 ORDER BY version ASC`,
        [rule.id]
      );
      
      // If version 1 is ENACTMENT and version 2 is ENACTMENT, merge them
      if (revisions.length >= 2) {
        const rev1 = revisions[0];
        const rev2 = revisions[1];
        
        if (rev1.version === 1 && rev2.version === 2 && rev1.revisionType === 'ENACTMENT' && rev2.revisionType === 'ENACTMENT') {
          await client.query("BEGIN");
          
          // Update rev1 with rev2's data
          await client.query(
            `UPDATE "Revision" SET "versionName" = $1, "enactmentDate" = $2, "effectiveDate" = $3 WHERE id = $4`,
            [rev2.versionName, rev2.enactmentDate, rev2.effectiveDate, rev1.id]
          );
          
          // Delete rev1's dummy articles
          await client.query(`DELETE FROM "Article" WHERE "revisionId" = $1`, [rev1.id]);
          
          // Move rev2's articles to rev1
          await client.query(`UPDATE "Article" SET "revisionId" = $1 WHERE "revisionId" = $2`, [rev1.id, rev2.id]);
          
          // Delete rev2
          await client.query(`DELETE FROM "Revision" WHERE id = $1`, [rev2.id]);
          
          await client.query("COMMIT");
          mergedCount++;
        }
      }
    }
    
    return NextResponse.json({ success: true, message: `Merged ${mergedCount} duplicate revisions` });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

