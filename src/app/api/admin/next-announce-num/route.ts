export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  let pool;
  try {
    pool = createPool();

    // Revision 테이블에서 "공포 제YYYY-N호" 형식의 announcementNumber 중 최신 것 조회
    const res = await pool.query(`
      SELECT "announcementNumber"
      FROM "Revision"
      WHERE "announcementNumber" LIKE '공포 제%호'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);

    const currentYear = new Date().getFullYear();
    let nextNum = `공포 제${currentYear}-1호`;

    if (res.rows.length > 0) {
      const latest = res.rows[0].announcementNumber as string;
      // "공포 제YYYY-N호" 형식 파싱
      const match = latest.match(/공포\s*제(\d{4})-(\d+)호/);
      if (match) {
        const year = parseInt(match[1], 10);
        const seq = parseInt(match[2], 10);
        if (year === currentYear) {
          // 같은 연도: 순번 +1
          nextNum = `공포 제${currentYear}-${seq + 1}호`;
        } else {
          // 새 연도: 1번으로 리셋
          nextNum = `공포 제${currentYear}-1호`;
        }
      }
    }

    return NextResponse.json({ nextAnnounceNum: nextNum });
  } catch (error: any) {
    console.error("[Next Announce Num GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) await pool.end();
  }
}
