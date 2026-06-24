export const runtime = "edge";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string    }> }
) {
  let pool;
  try {
    pool = createPool();
    const { id  } = await params;
    const { searchParams } = new URL(request.url);
    const versionParam = searchParams.get("version");

    const ruleRes = await pool.query(
      `SELECT 
        r.id, r.title, r."ruleNumber", r.status, r."categoryId", r."departmentId",
        c.id AS "catId", c.name AS "categoryName",
        d.id AS "deptId", d.name AS "departmentName"
       FROM "Rule" r
       LEFT JOIN "Category" c ON r."categoryId" = c.id
       LEFT JOIN "Department" d ON r."departmentId" = d.id
       WHERE r.id = $1`,
      [id]
    );

    if (ruleRes.rows.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    const ruleRow = ruleRes.rows[0];

    const revisionsRes = await pool.query(
      `SELECT id, version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description
       FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`,
      [id]
    );
    const revisions = revisionsRes.rows;

    const attachmentsRes = await pool.query(
      `SELECT id, title, "fileUrl", "fileType", "createdAt" FROM "Attachment" WHERE "ruleId" = $1 ORDER BY "createdAt" ASC`,
      [id]
    );

    if (revisions.length === 0) {
      return NextResponse.json({
        id: ruleRow.id,
        title: ruleRow.title,
        ruleNumber: ruleRow.ruleNumber,
        status: ruleRow.status,
        category: { id: ruleRow.catId, name: ruleRow.categoryName },
        department: { id: ruleRow.deptId, name: ruleRow.departmentName },
        attachments: attachmentsRes.rows,
        revisions: [],
        currentRevision: null,
      });
    }

    let targetRevisionId = "";
    if (versionParam) {
      const versionNum = parseInt(versionParam, 10);
      const matched = revisions.find((r) => r.version === versionNum);
      if (matched) targetRevisionId = matched.id;
    }
    if (!targetRevisionId) targetRevisionId = revisions[0].id;

    const articlesRes = await pool.query(
      `SELECT id, part, chapter, section, "subSection", "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder"
       FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`,
      [targetRevisionId]
    );

    const comparisonsRes = await pool.query(
      `SELECT 
        ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note,
        ba.part AS "before_part", ba.chapter AS "before_chapter", ba.section AS "before_section", ba."subSection" AS "before_subSection", ba."articleNumber" AS "before_articleNumber",
        ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson",
        aa.part AS "after_part", aa.chapter AS "after_chapter", aa.section AS "after_section", aa."subSection" AS "after_subSection", aa."articleNumber" AS "after_articleNumber",
        aa.title AS "after_title", aa."contentText" AS "after_contentText", aa."contentJson" AS "after_contentJson"
       FROM "ArticleComparison" ac
       LEFT JOIN "Article" ba ON ac."beforeArticleId" = ba.id
       LEFT JOIN "Article" aa ON ac."afterArticleId" = aa.id
       WHERE ac."revisionId" = $1 AND (ac.note IS NULL OR ac.note NOT LIKE '[단순오타수정전본문]%')`,
      [targetRevisionId]
    );

    const comparisons = comparisonsRes.rows.map((row) => ({
      id: row.id,
      note: row.note,
      beforeArticleId: row.beforeArticleId,
      afterArticleId: row.afterArticleId,
      beforeArticle: row.before_articleNumber
        ? {
            part: row.before_part,
            chapter: row.before_chapter,
            section: row.before_section,
            subSection: row.before_subSection,
            articleNumber: row.before_articleNumber,
            title: row.before_title,
            contentText: row.before_contentText,
            contentJson: row.before_contentJson,
          }
        : null,
      afterArticle: row.after_articleNumber
        ? {
            part: row.after_part,
            chapter: row.after_chapter,
            section: row.after_section,
            subSection: row.after_subSection,
            articleNumber: row.after_articleNumber,
            title: row.after_title,
            contentText: row.after_contentText,
            contentJson: row.after_contentJson,
          }
        : null,
    }));

    const targetRevision = revisions.find((r) => r.id === targetRevisionId);

    // 2-0-3 학업이수에 관한 규정 내 제25의2(특별학점인정) 오타 감지 및 독립 조문 완벽 분리
    let processedArticles: any[] = [];
    for (const art of articlesRes.rows) {
      if (art.contentText && art.contentText.includes("제25의2(특별학점인정)")) {
        const parts = art.contentText.split("제25의2(특별학점인정)");
        const art1 = { ...art, contentText: parts[0].trim(), contentJson: null };
        const art2 = {
          ...art,
          id: art.id + "_sub2",
          articleNumber: 25,
          title: "제25조의2(특별학점인정)",
          contentText: "제25조의2(특별학점인정)" + parts[1],
          contentJson: JSON.stringify([
            { type: "article", num: "제25조의2", text: "제25조의2(특별학점인정)" },
            { type: "text", num: "", text: parts[1].trim() }
          ]),
          sortOrder: art.sortOrder + 0.5
        };
        processedArticles.push(art1, art2);
      } else {
        processedArticles.push(art);
      }
    }

    const responseData = {
      id: ruleRow.id,
      title: ruleRow.title,
      ruleNumber: ruleRow.ruleNumber,
      status: ruleRow.status,
      category: { id: ruleRow.catId, name: ruleRow.categoryName },
      department: { id: ruleRow.deptId, name: ruleRow.departmentName },
      attachments: attachmentsRes.rows,
      revisions,
      currentRevision: {
        ...targetRevision,
        articles: processedArticles,
        comparisons,
      },
    };

    // HWP 등에서 변환 시 깨진 특수기호(󰂛)를 중간 점(·)으로 일괄 치환
    const cleanData = JSON.parse(JSON.stringify(responseData).replace(/󰂛/g, '·'));

    return NextResponse.json(cleanData);
  } catch (error: any) {
    console.error("[Rule API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) await pool.end();
  }
}
