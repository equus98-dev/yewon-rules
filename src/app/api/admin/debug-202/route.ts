export const runtime = "edge";
import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";
export async function GET(request: Request) {
  const pool = createPool();
  const ruleRes = await pool.query(`SELECT id FROM "Rule" WHERE "ruleNo" = '2-0-2'`);
  const addRes = await pool.query(`SELECT "enactmentDate", "title", "contentText" FROM "Addendum" WHERE "ruleId" = '${ruleRes.rows[0].id}'`);
  return NextResponse.json(addRes.rows);
}
