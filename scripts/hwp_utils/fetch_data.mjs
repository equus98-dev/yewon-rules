import { Pool } from "@neondatabase/serverless";
import fs from "fs";

const poolConfig = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.jagpwxgasudlnaoxfroe",
  password: "Tmtmfh0022$&*",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const pool = new Pool(poolConfig);
  try {
    const id = "50dcb72b-6706-40d6-b016-381ac51ebb91";
    // 1. 규정 기본 ?�보
    const ruleRes = await pool.query(
      `SELECT r.id, r.title, r."ruleNumber", r.status, r."categoryId", r."departmentId", c.id AS "catId", c.name AS "categoryName", d.id AS "deptId", d.name AS "departmentName" FROM "Rule" r LEFT JOIN "Category" c ON r."categoryId" = c.id LEFT JOIN "Department" d ON r."departmentId" = d.id WHERE r.id = $1`, [id]
    );
    const ruleRow = ruleRes.rows[0];

    // 2. ?�혁 목록
    const revisionsRes = await pool.query(
      `SELECT id, version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`, [id]
    );
    const revisions = revisionsRes.rows;

    // 3. 첨�??�일
    const attachmentsRes = await pool.query(
      `SELECT id, title, "fileUrl", "fileType", "createdAt" FROM "Attachment" WHERE "ruleId" = $1 ORDER BY "createdAt" ASC`, [id]
    );
    
    let targetRevisionId = revisions.length > 0 ? revisions[0].id : "";

    // 4. 조항 목록
    const articlesRes = await pool.query(
      `SELECT id, chapter, section, "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder" FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`, [targetRevisionId]
    );

    // 5. ?�비표
    const comparisonsRes = await pool.query(
      `SELECT ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note, ba.chapter AS "before_chapter", ba."articleNumber" AS "before_articleNumber", ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson", aa.chapter AS "after_chapter", aa."articleNumber" AS "after_articleNumber", aa.title AS "after_title", aa."contentText" AS "after_contentText", aa."contentJson" AS "after_contentJson" FROM "ArticleComparison" ac LEFT JOIN "Article" ba ON ac."beforeArticleId" = ba.id LEFT JOIN "Article" aa ON ac."afterArticleId" = aa.id WHERE ac."revisionId" = $1 ORDER BY ac."sortOrder" ASC`, [targetRevisionId]
    );

    const data = {
      id: ruleRow.id,
      title: ruleRow.title,
      ruleNumber: ruleRow.ruleNumber,
      status: ruleRow.status,
      category: { id: ruleRow.catId, name: ruleRow.categoryName },
      department: { id: ruleRow.deptId, name: ruleRow.departmentName },
      attachments: attachmentsRes.rows,
      revisions: revisions.map(r => ({ ...r, enactmentDate: String(r.enactmentDate), effectiveDate: String(r.effectiveDate) })),
      currentRevision: {
        ...revisions[0],
        enactmentDate: String(revisions[0].enactmentDate),
        effectiveDate: String(revisions[0].effectiveDate),
        articles: articlesRes.rows,
        comparisons: comparisonsRes.rows
      }
    };
    fs.writeFileSync("test_data.json", JSON.stringify(data, null, 2));
    console.log("Data written to test_data.json");
  } finally {
    await pool.end();
  }
}
main().catch(console.error);
