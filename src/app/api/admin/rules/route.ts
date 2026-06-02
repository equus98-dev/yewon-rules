// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

function getInitialSound(text: string): string {
  if (!text) return "ㄱ";
  const cleanText = text.replace(/[^가-힣a-zA-Z0-9]/g, "");
  if (cleanText.length === 0) return "ㄱ";
  const char = cleanText.charAt(0);
  const code = char.charCodeAt(0) - 0xac00;
  if (code >= 0 && code < 11172) {
    const chosungList = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    return chosungList[Math.floor(code / 588)];
  }
  return char.toUpperCase();
}

export async function GET(request: Request) {
  const pool = createPool();
  try {
    const res = await pool.query(`
      SELECT r.id, r.title, r."ruleNumber", r."initialSound", r.status, r."categoryId",
        c.name AS "categoryName", r."departmentId", d.name AS "departmentName",
        (SELECT "versionName" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "latestVersion",
        (SELECT "enactmentDate" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "enactmentDate"
      FROM "Rule" r
      LEFT JOIN "Category" c ON r."categoryId" = c.id
      LEFT JOIN "Department" d ON r."departmentId" = d.id
      ORDER BY r.title ASC
    `);
    return NextResponse.json(res.rows.map((r) => ({
      id: r.id, title: r.title, ruleNumber: r.ruleNumber, initialSound: r.initialSound,
      status: r.status, categoryId: r.categoryId, categoryName: r.categoryName || "미분류",
      departmentId: r.departmentId, departmentName: r.departmentName || "미지정",
      latestVersion: r.latestVersion || "제정",
      enactmentDate: r.enactmentDate ? new Date(r.enactmentDate).toISOString().split("T")[0] : "-",
    })));
  } catch (error: any) {
    console.error("[Admin Rules GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function POST(request: Request) {
  const pool = createPool();
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { title, ruleNumber, categoryId, departmentId, enactmentDate, announcementNumber, fileUrl, articles } = body;
    if (!title || !ruleNumber || !categoryId || !departmentId || !enactmentDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const dateParsed = new Date(enactmentDate);
    await client.query("BEGIN");
    const ruleId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "Rule" (id, title, "ruleNumber", "initialSound", status, "categoryId", "departmentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [ruleId, title, ruleNumber, getInitialSound(title), "EFFECTIVE", categoryId, departmentId]
    );
    const revisionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "Revision" (id, "ruleId", version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [revisionId, ruleId, 1, "제정", "ENACTMENT", dateParsed, dateParsed, announcementNumber || "최초공포", `${title} 최초 제정 공포 반영`]
    );
    if (fileUrl && fileUrl.trim() !== "") {
      const fileType = fileUrl.split(".").pop()?.split("?")[0] || "hwp";
      await client.query(
        `INSERT INTO "Attachment" (id, "ruleId", title, "fileUrl", "fileType", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [crypto.randomUUID(), ruleId, `${title}.${fileType}`, fileUrl, fileType]
      );
    }
    if (Array.isArray(articles) && articles.length > 0) {
      for (const art of articles) {
        await client.query(
          `INSERT INTO "Article" (id, "revisionId", chapter, section, "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [crypto.randomUUID(), revisionId, art.chapter || null, art.section || null, parseInt(art.articleNumber) || 1, art.title || "제목없음", JSON.stringify(art.contentJson || {}), art.contentText || "", art.sortOrder || 1]
        );
      }
    } else {
      await client.query(
        `INSERT INTO "Article" (id, "revisionId", chapter, "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [crypto.randomUUID(), revisionId, "제1장 총칙", 1, "목적", JSON.stringify({ paragraphs: ["이 규정은 학교의 운영에 관한 목적을 규정함을 목적으로 한다."] }), "제1조 (목적) 이 규정은 학교의 운영에 관한 목적을 규정함을 목적으로 한다.", 1]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true, ruleId });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("[Admin Rules POST Error]:", error);
    if (error.message?.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ error: "이미 존재하는 규정 번호입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}

export async function PUT(request: Request) {
  const pool = createPool();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    const body = await request.json();
    const { status, title, categoryId, departmentId } = body;
    const updates: string[] = [];
    const values: any[] = [];
    let valIdx = 1;
    if (status) { updates.push(`status = $${valIdx++}`); values.push(status); }
    if (title) { updates.push(`title = $${valIdx++}`); values.push(title); updates.push(`"initialSound" = $${valIdx++}`); values.push(getInitialSound(title)); }
    if (categoryId) { updates.push(`"categoryId" = $${valIdx++}`); values.push(categoryId); }
    if (departmentId) { updates.push(`"departmentId" = $${valIdx++}`); values.push(departmentId); }
    if (updates.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    updates.push(`"updatedAt" = NOW()`);
    values.push(id);
    const res = await pool.query(`UPDATE "Rule" SET ${updates.join(", ")} WHERE id = $${valIdx} RETURNING *`, values);
    if (res.rows.length === 0) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    return NextResponse.json({ success: true, rule: res.rows[0] });
  } catch (error: any) {
    console.error("[Admin Rules PUT Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function DELETE(request: Request) {
  const pool = createPool();
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    await client.query("BEGIN");
    await client.query(`DELETE FROM "Article" WHERE "revisionId" IN (SELECT id FROM "Revision" WHERE "ruleId" = $1)`, [id]);
    await client.query(`DELETE FROM "Comparison" WHERE "revisionId" IN (SELECT id FROM "Revision" WHERE "ruleId" = $1)`, [id]);
    await client.query(`DELETE FROM "Attachment" WHERE "ruleId" = $1`, [id]);
    await client.query(`DELETE FROM "Revision" WHERE "ruleId" = $1`, [id]);
    const ruleRes = await client.query(`DELETE FROM "Rule" WHERE id = $1 RETURNING *`, [id]);
    await client.query("COMMIT");
    if (ruleRes.rows.length === 0) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "규정이 성공적으로 삭제되었습니다." });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("[Admin Rules DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
