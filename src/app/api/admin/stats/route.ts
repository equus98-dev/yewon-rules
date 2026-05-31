export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. 기초 지표 카운트 집계
    const totalRules = await prisma.rule.count();
    const totalCategories = await prisma.category.count();
    const totalDepartments = await prisma.department.count();
    const totalAttachments = await prisma.attachment.count();

    // 2. 소관부서별 규정 보유 건수 집계
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { rules: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const deptStats = departments.map((d) => ({
      id: d.id,
      name: d.name,
      count: d._count.rules,
    }));

    // 3. 최근 제·개정 연혁 피드 (최신 5건)
    const recentRevisions = await prisma.revision.findMany({
      take: 5,
      include: {
        rule: {
          select: {
            title: true,
            ruleNumber: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { enactmentDate: "desc" },
    });

    const revisionFeed = recentRevisions.map((rev) => ({
      id: rev.id,
      ruleId: rev.ruleId,
      title: rev.rule.title,
      ruleNumber: rev.rule.ruleNumber,
      departmentName: rev.rule.department.name,
      versionName: rev.versionName,
      enactmentDate: rev.enactmentDate.toISOString().split("T")[0],
      effectiveDate: rev.effectiveDate.toISOString().split("T")[0],
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
    });
  } catch (error: any) {
    console.error("[Admin Stats API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
