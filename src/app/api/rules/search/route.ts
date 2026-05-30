export const runtime = "edge";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const initialSound = searchParams.get("initialSound") || "";
    const announcementNumber = searchParams.get("announcementNumber") || "";
    const enactmentStart = searchParams.get("enactmentStart") || "";
    const enactmentEnd = searchParams.get("enactmentEnd") || "";
    const revisionType = searchParams.get("revisionType") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const scope = searchParams.get("scope") || "current"; // current | history
    const options = searchParams.get("options") || "all"; // all, title, body, attachment

    // -------------------------------------------------------------
    // CASE A: 비어있는 검색어는 이전과 동일하게 단순 규정 배열 반환 (사이드바/대시보드 호환용)
    // -------------------------------------------------------------
    if (!query) {
      const where: Prisma.RuleWhereInput = {};

      if (scope === "current") {
        where.status = "EFFECTIVE";
      }

      if (initialSound) {
        where.initialSound = initialSound;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (departmentId) {
        where.departmentId = departmentId;
      }

      const revisionFilters: Prisma.RevisionWhereInput[] = [];
      if (announcementNumber) {
        revisionFilters.push({ announcementNumber: { contains: announcementNumber } });
      }

      if (enactmentStart || enactmentEnd) {
        revisionFilters.push({
          enactmentDate: {
            gte: enactmentStart ? new Date(enactmentStart) : undefined,
            lte: enactmentEnd ? new Date(enactmentEnd) : undefined,
          },
        });
      }

      if (revisionType) {
        revisionFilters.push({ revisionType: revisionType as any });
      }

      if (revisionFilters.length > 0) {
        where.revisions = {
          some: {
            AND: revisionFilters,
          },
        };
      }

      const rules = await prisma.rule.findMany({
        where,
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          revisions: {
            orderBy: { version: "desc" },
            take: 1,
            select: {
              versionName: true,
              enactmentDate: true,
              announcementNumber: true,
              revisionType: true,
            },
          },
        },
        orderBy: { title: "asc" },
      });

      const formattedRules = rules.map((rule) => {
        const latestRevision = rule.revisions[0] || null;
        return {
          id: rule.id,
          title: rule.title,
          ruleNumber: rule.ruleNumber,
          status: rule.status,
          categoryName: rule.category.name,
          departmentName: rule.department.name,
          latestVersionName: latestRevision?.versionName || "제정",
          enactmentDate: latestRevision?.enactmentDate || null,
          announcementNumber: latestRevision?.announcementNumber || "",
          revisionType: latestRevision?.revisionType || "ENACTMENT",
        };
      });

      return NextResponse.json(formattedRules);
    }

    // -------------------------------------------------------------
    // CASE B: 검색어가 명시된 경우 고도화된 그룹별 매칭 처리 (규정명, 규정내용, 별표/별지)
    // -------------------------------------------------------------
    const optionList = options.split(",");
    const isAll = optionList.includes("all") || optionList.length === 0;

    // 1. 규정명 매칭 (Title/Rule Number Match)
    let titleMatches: any[] = [];
    if (isAll || optionList.includes("title")) {
      const titleWhere: Prisma.RuleWhereInput = {
        AND: [
          scope === "current" ? { status: "EFFECTIVE" } : {},
          categoryId ? { categoryId } : {},
          departmentId ? { departmentId } : {},
          {
            OR: [
              { title: { contains: query } },
              { ruleNumber: { contains: query } }
            ]
          }
        ]
      };

      const matchedRules = await prisma.rule.findMany({
        where: titleWhere,
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          revisions: {
            orderBy: { version: "desc" },
            take: 1,
            select: {
              versionName: true,
              enactmentDate: true,
              announcementNumber: true,
            }
          }
        },
        orderBy: { title: "asc" }
      });

      titleMatches = matchedRules.map(rule => {
        const rev = rule.revisions[0] || null;
        return {
          id: rule.id,
          title: rule.title,
          ruleNumber: rule.ruleNumber,
          categoryName: rule.category.name,
          departmentName: rule.department.name,
          latestVersionName: rev?.versionName || "제정",
          enactmentDate: rev?.enactmentDate || null,
          announcementNumber: rev?.announcementNumber || "",
          status: rule.status
        };
      });
    }

    // 2. 규정내용 매칭 (Articles Match)
    let bodyMatches: any[] = [];
    if (isAll || optionList.includes("body")) {
      const articles = await prisma.article.findMany({
        where: {
          AND: [
            { contentText: { contains: query } },
            {
              revision: {
                rule: {
                  AND: [
                    scope === "current" ? { status: "EFFECTIVE" } : {},
                    categoryId ? { categoryId } : {},
                    departmentId ? { departmentId } : {}
                  ]
                }
              }
            }
          ]
        },
        include: {
          revision: {
            include: {
              rule: {
                include: {
                  category: { select: { name: true } },
                  department: { select: { name: true } }
                }
              }
            }
          }
        },
        orderBy: { articleNumber: "asc" }
      });

      // 동일 규정별로 묶지 않고 각각의 조항 매칭을 리스트업하여 가치 극대화
      bodyMatches = articles.map(art => {
        const rule = art.revision.rule;
        // 조항 매칭 텍스트 스니펫 생성
        const text = art.contentText;
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + query.length + 50);
        const snippet = (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");

        return {
          id: rule.id,
          title: rule.title,
          ruleNumber: rule.ruleNumber,
          categoryName: rule.category.name,
          departmentName: rule.department.name,
          articleTitle: `제${art.articleNumber}조 (${art.title})`,
          snippet,
          enactmentDate: art.revision.enactmentDate,
          latestVersionName: art.revision.versionName
        };
      });
    }

    // 3. 별표/별지 매칭 (Attachments Match)
    let attachmentMatches: any[] = [];
    if (isAll || optionList.includes("attachment")) {
      const attachments = await prisma.attachment.findMany({
        where: {
          AND: [
            { title: { contains: query } },
            {
              rule: {
                AND: [
                  scope === "current" ? { status: "EFFECTIVE" } : {},
                  categoryId ? { categoryId } : {},
                  departmentId ? { departmentId } : {}
                ]
              }
            }
          ]
        },
        include: {
          rule: {
            include: {
              category: { select: { name: true } },
              department: { select: { name: true } },
              revisions: {
                orderBy: { version: "desc" },
                take: 1,
                select: {
                  enactmentDate: true,
                  versionName: true
                }
              }
            }
          }
        },
        orderBy: { title: "asc" }
      });

      attachmentMatches = attachments.map(att => {
        const rule = att.rule;
        const rev = rule.revisions[0] || null;
        return {
          id: att.id,
          title: att.title,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          ruleId: rule.id,
          ruleTitle: rule.title,
          ruleNumber: rule.ruleNumber,
          categoryName: rule.category.name,
          departmentName: rule.department.name,
          latestVersionName: rev?.versionName || "제정",
          enactmentDate: rev?.enactmentDate || null
        };
      });
    }

    return NextResponse.json({
      isGrouped: true,
      titleMatches,
      bodyMatches,
      attachmentMatches
    });

  } catch (error: any) {
    console.error("[Search API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
