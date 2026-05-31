// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

const poolConfig = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.jagpwxgasudlnaoxfroe",
  password: "Tmtmfh0022$&*",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
};

export async function GET() {
  const pool = new Pool(poolConfig);
  try {
    const res = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a."fileUrl",
        a."fileType",
        a."ruleId",
        a."createdAt",
        r.title AS "ruleTitle",
        r."ruleNumber"
      FROM "Attachment" a
      LEFT JOIN "Rule" r ON a."ruleId" = r.id
      ORDER BY a.title ASC
    `);
    await pool.end();
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error("[Attachments GET Error]:", error);
    await pool.end();
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
