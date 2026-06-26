export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    const offset = (page - 1) * limit;

    let countQuery = `SELECT COUNT(*) as total FROM "Opinion"`;
    let countParams: any[] = [];
    
    let query = `
      SELECT id, title, author, "attachmentName", "adminComment", "createdAt"
      FROM "Opinion"
    `;
    let params: any[] = [];

    if (search) {
      const searchCondition = ` WHERE title LIKE $1 OR content LIKE $1 OR author LIKE $1`;
      countQuery += searchCondition;
      countParams.push(`%${search}%`);
      
      query += searchCondition;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const countRes = await pool.query(countQuery, countParams);
    const total = parseInt(countRes.rows[0].total as string || "0");

    const res = await pool.query(query, params);

    return NextResponse.json({
      data: res.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("[Opinions API GET Error]:", error);
    return NextResponse.json({ error: "내부 서버 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}

// 비밀번호 해싱 유틸리티 (서버 전용)
async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function POST(request: Request) {
  let pool;
  try {
    pool = createPool();
    const body = (await request.json()) as any;
    const { title, content, author, password, attachmentUrl, attachmentName } = body;

    if (!title || !content || !author || !password) {
      return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
    }

    // HTML 제거 (XSS 방어)
    const sanitizeHtml = (str: string) => {
      return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedAuthor = sanitizeHtml(author);
    
    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);
    const newId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO "Opinion" (id, title, content, author, password, "attachmentUrl", "attachmentName", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [newId, sanitizedTitle, sanitizedContent, sanitizedAuthor, hashedPassword, attachmentUrl || null, attachmentName || null]
    );

    return NextResponse.json({ success: true, id: newId });
  } catch (error: any) {
    console.error("[Opinions API POST Error]:", error);
    return NextResponse.json({ error: "내부 서버 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
