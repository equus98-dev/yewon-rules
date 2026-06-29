export const runtime = "edge";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool: any;
  try {
    pool = createPool();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const initialSound = searchParams.get("initialSound") || "";
    const announcementNumber = searchParams.get("announcementNumber") || "";
    const enactmentStart = searchParams.get("enactmentStart") || "";
    const enactmentEnd = searchParams.get("enactmentEnd") || "";
    const revisionType = searchParams.get("revisionType") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const scope = searchParams.get("scope") || "current";
    const options = searchParams.get("options") || "all";

    if (!query) {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (scope === "current") { conditions.push(`r.status = 'EFFECTIVE'`); }
      if (initialSound) { conditions.push(`r."initialSound" = $${idx++}`); values.push(initialSound); }
      if (categoryId) {
        if (categoryId.startsWith("virtual-")) {
          const parentName = categoryId.replace("virtual-", "");
          conditions.push(`c.name LIKE $${idx++}`);
          values.push(`${parentName}%`);
        } else {
          conditions.push(`r."categoryId" = $${idx++}`);
          values.push(categoryId);
        }
      }
      if (departmentId) { conditions.push(`r."departmentId" = $${idx++}`); values.push(departmentId); }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const revConds: string[] = [];
      const revValues: any[] = [];
      let revIdx = idx;
      if (announcementNumber) { revConds.push(`"announcementNumber" ILIKE $${revIdx++}`); revValues.push(`%${announcementNumber}%`); }
      if (enactmentStart) { revConds.push(`"enactmentDate" >= $${revIdx++}`); revValues.push(new Date(enactmentStart)); }
      if (enactmentEnd) { revConds.push(`"enactmentDate" <= $${revIdx++}`); revValues.push(new Date(enactmentEnd)); }
      if (revisionType) { revConds.push(`"revisionType" = $${revIdx++}`); revValues.push(revisionType); }

      let finalWhereClause = whereClause;
      if (revConds.length > 0) {
        const revSubQuery = `EXISTS (SELECT 1 FROM "Revision" rev WHERE rev."ruleId" = r.id AND ${revConds.join(" AND ")})`;
        finalWhereClause = conditions.length > 0 ? `${whereClause} AND ${revSubQuery}` : `WHERE ${revSubQuery}`;
      }

      const res = await pool.query(
        `SELECT
          r.id, r.title, r."ruleNumber", r."initialSound", r.status, r."categoryId", r."departmentId",
          c.name AS "categoryName", d.name AS "departmentName",
          (SELECT "versionName" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "latestVersionName",
          (SELECT "enactmentDate" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "enactmentDate",
          (SELECT "announcementNumber" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "announcementNumber",
          (SELECT "revisionType" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "revisionType",
          (SELECT a."fileUrl" FROM "Attachment" a WHERE a."ruleId" = r.id AND (a."fileType" ILIKE '%hwp%' OR a.title ILIKE '%.hwp') AND a.title NOT ILIKE '%서식%' AND a.title NOT ILIKE '%별표%' AND a.title NOT ILIKE '%별지%' LIMIT 1) AS "hwpUrl",
          (SELECT a."fileUrl" FROM "Attachment" a WHERE a."ruleId" = r.id AND (a."fileType" ILIKE '%pdf%' OR a.title ILIKE '%.pdf') AND a.title NOT ILIKE '%서식%' AND a.title NOT ILIKE '%별표%' AND a.title NOT ILIKE '%별지%' LIMIT 1) AS "pdfUrl"
         FROM "Rule" r
         LEFT JOIN "Category" c ON r."categoryId" = c.id
         LEFT JOIN "Department" d ON r."departmentId" = d.id
         ${finalWhereClause}
         ORDER BY r.title ASC`,
        [...values, ...revValues]
      );
      
      const sortedRows = res.rows.sort((a: any, b: any) => {
        if (!a.ruleNumber && !b.ruleNumber) return 0;
        if (!a.ruleNumber) return 1;
        if (!b.ruleNumber) return -1;
        const partsA = a.ruleNumber.split('-').map(Number);
        const partsB = b.ruleNumber.split('-').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const valA = partsA[i] || 0;
          const valB = partsB[i] || 0;
          if (valA !== valB) return valA - valB;
        }
        return 0;
      });

      return NextResponse.json(sortedRows);
    }

    const optionList = options.split(",");
    const isAll = optionList.includes("all") || optionList.length === 0;
    const scopeCond = scope === "current" ? `AND r.status = 'EFFECTIVE'` : "";
    const catCond = categoryId 
      ? (categoryId.startsWith("virtual-") 
        ? `AND c.name LIKE '${categoryId.replace("virtual-", "").replace(/'/g, "''")}%'` 
        : `AND r."categoryId" = '${categoryId.replace(/'/g, "''")}'`) 
      : "";
    const deptCond = departmentId ? `AND r."departmentId" = '${departmentId.replace(/'/g, "''")}'` : "";
    const likeQuery = `%${query}%`;

    let titleMatches: any[] = [];
    if (isAll || optionList.includes("title")) {
      const r = await pool.query(
        `SELECT
          r.id, r.title, r."ruleNumber", r.status,
          c.name AS "categoryName", d.name AS "departmentName",
          (SELECT "versionName" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "latestVersionName",
          (SELECT "enactmentDate" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "enactmentDate",
          (SELECT "announcementNumber" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "announcementNumber"
         FROM "Rule" r
         LEFT JOIN "Category" c ON r."categoryId" = c.id
         LEFT JOIN "Department" d ON r."departmentId" = d.id
         WHERE (r.title ILIKE $1 OR r."ruleNumber" ILIKE $1) ${scopeCond} ${catCond} ${deptCond}
         ORDER BY r.title ASC`,
        [likeQuery]
      );
      titleMatches = r.rows;
    }

    let bodyMatches: any[] = [];
    if (isAll || optionList.includes("body")) {
      const r = await pool.query(
        `SELECT
          a.id AS "articleId", a."articleNumber", a.title AS "articleTitle", a."contentText",
          r.id, r.title, r."ruleNumber", r.status,
          c.name AS "categoryName", d.name AS "departmentName",
          rev."versionName" AS "latestVersionName", rev."enactmentDate"
         FROM "Article" a
         JOIN "Revision" rev ON a."revisionId" = rev.id
         JOIN "Rule" r ON rev."ruleId" = r.id
         LEFT JOIN "Category" c ON r."categoryId" = c.id
         LEFT JOIN "Department" d ON r."departmentId" = d.id
         WHERE a."contentText" ILIKE $1 ${scopeCond} ${catCond} ${deptCond}
         ORDER BY a."articleNumber" ASC`,
        [likeQuery]
      );
      bodyMatches = r.rows.map((art) => {
        const text = art.contentText || "";
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + query.length + 50);
        const snippet = (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
        return {
          id: art.id,
          title: art.title,
          ruleNumber: art.ruleNumber,
          categoryName: art.categoryName,
          departmentName: art.departmentName,
          articleTitle: `제${art.articleNumber}조 (${art.articleTitle})`,
          snippet,
          enactmentDate: art.enactmentDate,
          latestVersionName: art.latestVersionName,
        };
      });
    }

    let attachmentMatches: any[] = [];
    if (isAll || optionList.includes("attachment")) {
      const r = await pool.query(
        `SELECT
          a.id, a.title, a."fileUrl", a."fileType",
          r.id AS "ruleId", r.title AS "ruleTitle", r."ruleNumber",
          c.name AS "categoryName", d.name AS "departmentName",
          (SELECT "versionName" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "latestVersionName",
          (SELECT "enactmentDate" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "enactmentDate"
         FROM "Attachment" a
         JOIN "Rule" r ON a."ruleId" = r.id
         LEFT JOIN "Category" c ON r."categoryId" = c.id
         LEFT JOIN "Department" d ON r."departmentId" = d.id
         WHERE a.title ILIKE $1 ${scopeCond} ${catCond} ${deptCond}
         ORDER BY a.title ASC`,
        [likeQuery]
      );
      attachmentMatches = r.rows;
    }

    const responseData = { isGrouped: true, titleMatches, bodyMatches, attachmentMatches };
    // HWP 특수문자 깨짐(󰂛) 방지 및 불필요한 '개정전문사항' 문구 완벽 제거
    const cleanData = JSON.parse(JSON.stringify(responseData).replace(/󰂛/g, '·').replace(/\s*개정전문사항/g, ''));
    return NextResponse.json(cleanData);
  } catch (error: any) {
    console.error("[Search API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) await pool.end();
  }
}
