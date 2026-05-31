// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

// 초정밀 접속 설정 객체
const poolConfig = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.jagpwxgasudlnaoxfroe",
  password: "Tmtmfh0022$&*",
  database: "postgres",
  ssl: {
    rejectUnauthorized: false
  }
};

// 1. 공지사항 전체 목록 조회 (GET)
export async function GET(request: Request) {
  const pool = new Pool(poolConfig);
  try {
    const res = await pool.query('SELECT id, title, content, dept, date, "createdAt", "updatedAt" FROM "Notice" ORDER BY "createdAt" DESC');
    await pool.end();
    
    const notices = res.rows.map((row) => ({
      ...row,
      date: row.date || "-",
    }));

    return NextResponse.json(notices);
  } catch (error: any) {
    console.error("[Notice GET API Error]:", error);
    await pool.end();
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. 신규 공지사항 작성 (POST)
export async function POST(request: Request) {
  const pool = new Pool(poolConfig);
  try {
    const { title, content, dept, date } = await request.json();

    if (!title || !content || !dept || !date) {
      await pool.end();
      return NextResponse.json(
        { error: "필수 입력 항목(제목, 내용, 부서, 일자)이 누락되었습니다." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const queryText = `
      INSERT INTO "Notice" (id, title, content, dept, date, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const res = await pool.query(queryText, [id, title, content, dept, date]);
    await pool.end();

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("[Notice POST API Error]:", error);
    await pool.end();
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 3. 기존 공지사항 수정 (PUT)
export async function PUT(request: Request) {
  const pool = new Pool(poolConfig);
  try {
    const { id, title, content, dept, date } = await request.json();

    if (!id || !title || !content || !dept || !date) {
      await pool.end();
      return NextResponse.json(
        { error: "필수 수정 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    const queryText = `
      UPDATE "Notice"
      SET title = $1, content = $2, dept = $3, date = $4, "updatedAt" = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const res = await pool.query(queryText, [title, content, dept, date, id]);
    await pool.end();

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "공지사항을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error("[Notice PUT API Error]:", error);
    await pool.end();
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 4. 공지사항 삭제 (DELETE)
export async function DELETE(request: Request) {
  const pool = new Pool(poolConfig);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      await pool.end();
      return NextResponse.json(
        { error: "삭제 대상 공지사항 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const queryText = `DELETE FROM "Notice" WHERE id = $1 RETURNING *`;
    const res = await pool.query(queryText, [id]);
    await pool.end();

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "공지사항을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ message: "공지사항이 성공적으로 삭제되었습니다." });
  } catch (error: any) {
    console.error("[Notice DELETE API Error]:", error);
    await pool.end();
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
