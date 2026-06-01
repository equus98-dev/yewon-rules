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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = new Pool(poolConfig);
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const versionParam = searchParams.get("version");

    // 1. 규정 기본 정보 조회
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
      await pool.end();
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    const ruleRow = ruleRes.rows[0];

    // 2. 연혁 목록 조회
    const revisionsRes = await pool.query(
      `SELECT id, version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description
       FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`,
      [id]
    );
    const revisions = revisionsRes.rows;

    // 3. 첨부파일 조회
    const attachmentsRes = await pool.query(
      `SELECT id, title, "fileUrl", "fileType", "createdAt" FROM "Attachment" WHERE "ruleId" = $1 ORDER BY "createdAt" ASC`,
      [id]
    );

    if (revisions.length === 0) {
      await pool.end();
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

    // 4. 조회할 버전 결정
    let targetRevisionId = "";
    if (versionParam) {
      const versionNum = parseInt(versionParam, 10);
      const matched = revisions.find((r) => r.version === versionNum);
      if (matched) targetRevisionId = matched.id;
    }
    if (!targetRevisionId) targetRevisionId = revisions[0].id;

    // 5. 선택된 버전의 조항 목록 조회
    const articlesRes = await pool.query(
      `SELECT id, chapter, section, "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder"
       FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`,
      [targetRevisionId]
    );

    // 6. 신구조문대비표 조회
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
       WHERE ac."revisionId" = $1`,
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

    await pool.end();

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
    await pool.end();
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
