export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool: any;
  try {
    pool = createPool();
    const res = await pool.query('SELECT id, title, content, dept, date, "createdAt", "updatedAt" FROM "Notice" ORDER BY "createdAt" DESC');
    const notices = res.rows.map((row) => ({ ...row, date: row.date || "-" }));
    return NextResponse.json(notices);
  } catch (error: any) {
    console.error("[Notice GET API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) if (pool) await pool.end();
  }
}

export async function POST(request: Request) {
  let pool;
  try {
    pool = createPool();
    const { title, content, dept, date } = await request.json();
    if (!title || !content || !dept || !date) {
      return NextResponse.json({ error: "필수 입력 항목(제목, 내용, 부서, 일자)이 누락되었습니다." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const res = await pool.query(
      `INSERT INTO "Notice" (id, title, content, dept, date, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [id, title, content, dept, date]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("[Notice POST API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) if (pool) await pool.end();
  }
}

export async function PUT(request: Request) {
  let pool;
  try {
    pool = createPool();
    const { id, title, content, dept, date } = await request.json();
    if (!id || !title || !content || !dept || !date) {
      return NextResponse.json({ error: "필수 수정 항목이 누락되었습니다." }, { status: 400 });
    }
    const res = await pool.query(
      `UPDATE "Notice" SET title = $1, content = $2, dept = $3, date = $4, "updatedAt" = NOW() WHERE id = $5 RETURNING *`,
      [title, content, dept, date, id]
    );
    if (res.rows.length === 0) return NextResponse.json({ error: "공지사항을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error("[Notice PUT API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) if (pool) await pool.end();
  }
}

export async function DELETE(request: Request) {
  let pool;
  try {
    pool = createPool();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "삭제 대상 공지사항 ID가 필요합니다." }, { status: 400 });
    const res = await pool.query(`DELETE FROM "Notice" WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: "공지사항을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ message: "공지사항이 성공적으로 삭제되었습니다." });
  } catch (error: any) {
    console.error("[Notice DELETE API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) if (pool) await pool.end();
  }
}
