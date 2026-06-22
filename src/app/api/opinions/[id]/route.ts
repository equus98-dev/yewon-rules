export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  let pool;
  try {
    pool = createPool();
    const id = params.id;

    const res = await pool.query(
      `SELECT id, title, content, author, "attachmentUrl", "attachmentName", "createdAt", "updatedAt"
       FROM "Opinion" WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error("[Opinions API GET Error]:", error);
    return NextResponse.json({ error: "내부 서버 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  let pool;
  try {
    pool = createPool();
    const id = params.id;
    const body = (await request.json()) as any;
    const { title, content, author, password, attachmentUrl, attachmentName } = body;

    if (!title || !content || !author || !password) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
    }

    // 비밀번호 검증
    const res = await pool.query(`SELECT password FROM "Opinion" WHERE id = $1`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    const savedPassword = res.rows[0].password as string;
    const hashedPassword = await hashPassword(password);

    if (savedPassword !== hashedPassword) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }

    // HTML 제거
    const sanitizeHtml = (str: string) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedAuthor = sanitizeHtml(author);

    await pool.query(
      `UPDATE "Opinion" 
       SET title = $1, content = $2, author = $3, "attachmentUrl" = $4, "attachmentName" = $5, "updatedAt" = NOW()
       WHERE id = $6`,
      [sanitizedTitle, sanitizedContent, sanitizedAuthor, attachmentUrl || null, attachmentName || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Opinions API PUT Error]:", error);
    return NextResponse.json({ error: "내부 서버 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  let pool;
  try {
    pool = createPool();
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const isAdminOverride = searchParams.get("admin") === "true"; // 실제로는 더 안전한 어드민 토큰/세션 체크 필요

    const res = await pool.query(`SELECT password FROM "Opinion" WHERE id = $1`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    if (!isAdminOverride) {
      if (!password) {
        return NextResponse.json({ error: "비밀번호가 필요합니다." }, { status: 400 });
      }
      const savedPassword = res.rows[0].password as string;
      const hashedPassword = await hashPassword(password);
      if (savedPassword !== hashedPassword) {
        return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
      }
    }

    await pool.query(`DELETE FROM "Opinion" WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Opinions API DELETE Error]:", error);
    return NextResponse.json({ error: "내부 서버 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
