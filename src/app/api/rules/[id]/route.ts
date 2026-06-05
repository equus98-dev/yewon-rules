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
      `SELECT id, chapter, section, "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder"
       FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`,
      [targetRevisionId]
    );

    const comparisonsRes = await pool.query(
      `SELECT 
        ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note,
        ba.chapter AS "before_chapter", ba."articleNumber" AS "before_articleNumber",
        ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson",
        aa.chapter AS "after_chapter", aa."articleNumber" AS "after_articleNumber",
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
            chapter: row.before_chapter,
            articleNumber: row.before_articleNumber,
            title: row.before_title,
            contentText: row.before_contentText,
            contentJson: row.before_contentJson,
          }
        : null,
      afterArticle: row.after_articleNumber
        ? {
            chapter: row.after_chapter,
            articleNumber: row.after_articleNumber,
            title: row.after_title,
            contentText: row.after_contentText,
            contentJson: row.after_contentJson,
          }
        : null,
    }));

    const targetRevision = revisions.find((r) => r.id === targetRevisionId);

    return NextResponse.json({
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
        articles: articlesRes.rows,
        comparisons,
      },
    });
  } catch (error: any) {
    console.error("[Rule API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) await pool.end();
  }
}
