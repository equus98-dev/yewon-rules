export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  const pool = createPool();
  try {
    const rRules = await pool.query('SELECT COUNT(*) as count FROM "Rule"');
    const rCategories = await pool.query('SELECT COUNT(*) as count FROM "Category"');
    const rDepartments = await pool.query('SELECT COUNT(*) as count FROM "Department"');
    const rAttachments = await pool.query('SELECT COUNT(*) as count FROM "Attachment"');
    const rDepts = await pool.query(`
      SELECT d.id, d.name, COUNT(r.id) as count 
      FROM "Department" d

      LEFT JOIN "Rule" r ON r."departmentId" = d.id
      GROUP BY d.id, d.name, d."sortOrder"
      ORDER BY d."sortOrder" ASC
    `);
    const rRevs = await pool.query(`
      SELECT 
        rev.id, rev."ruleId", r.title, r."ruleNumber", d.name as "departmentName", 
        rev."versionName", rev."enactmentDate", rev."effectiveDate", rev."announcementNumber"
      FROM "Revision" rev
      JOIN "Rule" r ON r.id = rev."ruleId"
      JOIN "Department" d ON d.id = r."departmentId"
      ORDER BY rev."enactmentDate" DESC
      LIMIT 5
    `);

    const revisionFeed = rRevs.rows.map((rev: any) => ({
      id: rev.id,
      ruleId: rev.ruleId,
      title: rev.title,
      ruleNumber: rev.ruleNumber,
      departmentName: rev.departmentName,
      versionName: rev.versionName,
      enactmentDate: new Date(rev.enactmentDate).toISOString().split("T")[0],
      effectiveDate: new Date(rev.effectiveDate).toISOString().split("T")[0],
      announcementNumber: rev.announcementNumber,
    }));

    return NextResponse.json({
      counts: {
        rules: rRules.rows[0].count,
        categories: rCategories.rows[0].count,
        departments: rDepartments.rows[0].count,
        attachments: rAttachments.rows[0].count,
      },
      deptStats: rDepts.rows,
      revisionFeed,
      debugInfo: { status: "SUCCESS" },
    });
  } catch (error: any) {
    console.error("[Admin Stats API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error", debugInfo: { status: "ERROR" } }, { status: 500 });
  } finally {
    await pool.end();
  }
}
