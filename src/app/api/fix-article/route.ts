export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      updated: {},
      remaining: {}
    };

    // 1. Article contentText 변경
    const resArtText1 = await pool.query(`
      UPDATE "Article" 
      SET "contentText" = REPLACE("contentText", '교학지원처', '교무지원처') 
      WHERE "contentText" LIKE '%교학지원처%'
    `);
    const resArtText2 = await pool.query(`
      UPDATE "Article" 
      SET "contentText" = REPLACE("contentText", '입학홍보처', '입학지원처') 
      WHERE "contentText" LIKE '%입학홍보처%'
    `);
    results.updated.articleContentText = {
      kyo: resArtText1.rowCount || 0,
      ip: resArtText2.rowCount || 0
    };

    // 2. Article contentHtml 변경
    const resArtHtml1 = await pool.query(`
      UPDATE "Article" 
      SET "contentHtml" = REPLACE("contentHtml", '교학지원처', '교무지원처') 
      WHERE "contentHtml" LIKE '%교학지원처%'
    `);
    const resArtHtml2 = await pool.query(`
      UPDATE "Article" 
      SET "contentHtml" = REPLACE("contentHtml", '입학홍보처', '입학지원처') 
      WHERE "contentHtml" LIKE '%입학홍보처%'
    `);
    results.updated.articleContentHtml = {
      kyo: resArtHtml1.rowCount || 0,
      ip: resArtHtml2.rowCount || 0
    };

    // 3. Article contentJson 변경
    const resArtJson1 = await pool.query(`
      UPDATE "Article" 
      SET "contentJson" = REPLACE("contentJson", '교학지원처', '교무지원처') 
      WHERE "contentJson" LIKE '%교학지원처%'
    `);
    const resArtJson2 = await pool.query(`
      UPDATE "Article" 
      SET "contentJson" = REPLACE("contentJson", '입학홍보처', '입학지원처') 
      WHERE "contentJson" LIKE '%입학홍보처%'
    `);
    results.updated.articleContentJson = {
      kyo: resArtJson1.rowCount || 0,
      ip: resArtJson2.rowCount || 0
    };

    // 4. Article title 변경
    const resArtTitle1 = await pool.query(`
      UPDATE "Article" 
      SET "title" = REPLACE("title", '교학지원처', '교무지원처') 
      WHERE "title" LIKE '%교학지원처%'
    `);
    const resArtTitle2 = await pool.query(`
      UPDATE "Article" 
      SET "title" = REPLACE("title", '입학홍보처', '입학지원처') 
      WHERE "title" LIKE '%입학홍보처%'
    `);
    results.updated.articleTitle = {
      kyo: resArtTitle1.rowCount || 0,
      ip: resArtTitle2.rowCount || 0
    };

    // 5. Rule title 변경
    const resRuleTitle1 = await pool.query(`
      UPDATE "Rule" 
      SET "title" = REPLACE("title", '교학지원처', '교무지원처') 
      WHERE "title" LIKE '%교학지원처%'
    `);
    const resRuleTitle2 = await pool.query(`
      UPDATE "Rule" 
      SET "title" = REPLACE("title", '입학홍보처', '입학지원처') 
      WHERE "title" LIKE '%입학홍보처%'
    `);
    results.updated.ruleTitle = {
      kyo: resRuleTitle1.rowCount || 0,
      ip: resRuleTitle2.rowCount || 0
    };

    // 6. Department name 변경
    await pool.query(`
      UPDATE "Department" 
      SET name = '교무지원처' 
      WHERE name = '교학지원처' OR code = 'ACADEMIC'
    `);
    await pool.query(`
      UPDATE "Department" 
      SET name = '입학지원처' 
      WHERE name = '입학홍보처' OR code = 'ADMISSIONS'
    `);

    // 7. Revision description 변경
    await pool.query(`
      UPDATE "Revision" 
      SET description = REPLACE(description, '교학지원처', '교무지원처') 
      WHERE description LIKE '%교학지원처%'
    `);
    await pool.query(`
      UPDATE "Revision" 
      SET description = REPLACE(description, '입학홍보처', '입학지원처') 
      WHERE description LIKE '%입학홍보처%'
    `);

    // 잔여 검증 쿼리
    const checkKyo = await pool.query(`
      SELECT count(*) as count FROM "Article" 
      WHERE "contentText" LIKE '%교학지원처%' 
         OR "contentHtml" LIKE '%교학지원처%' 
         OR "contentJson" LIKE '%교학지원처%' 
         OR "title" LIKE '%교학지원처%'
    `);
    const checkIp = await pool.query(`
      SELECT count(*) as count FROM "Article" 
      WHERE "contentText" LIKE '%입학홍보처%' 
         OR "contentHtml" LIKE '%입학홍보처%' 
         OR "contentJson" LIKE '%입학홍보처%' 
         OR "title" LIKE '%입학홍보처%'
    `);

    results.remaining = {
      kyoRemainingCount: checkKyo.rows[0]?.count ?? 0,
      ipRemainingCount: checkIp.rows[0]?.count ?? 0
    };

    return NextResponse.json({
      success: true,
      message: "2026 조직개편 부서명(교학지원처->교무지원처, 입학홍보처->입학지원처) 전수 조문 업데이트 완료",
      results
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
