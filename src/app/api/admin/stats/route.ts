// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // 1. 기초 지표 카운트 집계 (Prisma 엔진을 배제하고 초경량 순수 SQL로 정밀 가동)
    const rRules = await pool.query('SELECT COUNT(*)::int as count FROM "Rule"');
    const rCategories = await pool.query('SELECT COUNT(*)::int as count FROM "Category"');
    const rDepartments = await pool.query('SELECT COUNT(*)::int as count FROM "Department"');
    const rAttachments = await pool.query('SELECT COUNT(*)::int as count FROM "Attachment"');

    const totalRules = rRules.rows[0].count;
    const totalCategories = rCategories.rows[0].count;
    const totalDepartments = rDepartments.rows[0].count;
    const totalAttachments = rAttachments.rows[0].count;

    // 2. 소관부서별 규정 보유 건수 집계
    const rDepts = await pool.query(`
      SELECT d.id, d.name, COUNT(r.id)::int as count 
      FROM "Department" d
      LEFT JOIN "Rule" r ON r."departmentId" = d.id
      GROUP BY d.id, d.name, d."sortOrder"
      ORDER BY d."sortOrder" ASC
    `);
    const deptStats = rDepts.rows;

    // 3. 최근 제·개정 연혁 피드 (최신 5건)
    const rRevs = await pool.query(`
      SELECT 
        rev.id, 
        rev."ruleId", 
        r.title, 
        r."ruleNumber", 
        d.name as "departmentName", 
        rev."versionName", 
        rev."enactmentDate", 
        rev."effectiveDate", 
        rev."announcementNumber"
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
        rules: totalRules,
        categories: totalCategories,
        departments: totalDepartments,
        attachments: totalAttachments,
      },
      deptStats,
      revisionFeed,
      debugInfo: { status: "SUCCESS" }
    });
  } catch (error: any) {
    console.error("[Admin Stats API Error]:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal Server Error",
        debugInfo: { status: "ERROR" }
      },
      { status: 500 }
    );
  }
}
