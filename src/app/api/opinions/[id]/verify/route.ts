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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let pool;
  try {
    pool = createPool();
    const id = params.id;
    const body = (await request.json()) as any;
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
    }

    const res = await pool.query(`SELECT password FROM "Opinion" WHERE id = $1`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    }

    const savedPassword = res.rows[0].password as string;
    const hashedPassword = await hashPassword(password);

    if (savedPassword !== hashedPassword) {
      return NextResponse.json({ valid: false, error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("[Opinions API Verify Error]:", error);
    return NextResponse.json({ error: "내부 서버 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
