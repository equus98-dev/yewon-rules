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

    // 8. 3-3-20 원격수업 운영에 관한 규정 조문 분리 (제2조 내 제3조, 제4조 분리 및 제5조 이하 분리)
    try {
      const revRes = await pool.query(`
        SELECT id FROM "Revision" 
        WHERE "ruleId" = (SELECT id FROM "Rule" WHERE "ruleNumber" = '3-3-20' LIMIT 1)
        ORDER BY version DESC LIMIT 1
      `);
      if (revRes.rows.length > 0) {
        const revId = revRes.rows[0].id;
        const art2Res = await pool.query(`
          SELECT id, "contentText" FROM "Article" 
          WHERE "revisionId" = $1 AND "articleNumber" = 2 AND "contentText" LIKE '%제3조(학점인정)%'
        `, [revId]);

        if (art2Res.rows.length > 0) {
          const art2 = art2Res.rows[0];
          const rawText = art2.contentText;
          const idx3 = rawText.indexOf("제3조(학점인정)");
          const idx4 = rawText.indexOf("제4조(원격수업의 개설 및 운영)");

          const text2 = rawText.slice(0, idx3).trim();
          const text3 = (idx4 !== -1 ? rawText.slice(idx3, idx4) : rawText.slice(idx3)).trim();
          const text4 = idx4 !== -1 ? rawText.slice(idx4).trim() : "";

          await pool.query(`UPDATE "Article" SET "contentText" = $1, "title" = '용어의 정의', "sortOrder" = 2 WHERE id = $2`, [text2, art2.id]);

          const checkArt3 = await pool.query(`SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 3`, [revId]);
          if (checkArt3.rows.length === 0) {
            const id3 = "art_3_3_20_rev_" + revId + "_art3";
            await pool.query(`
              INSERT INTO "Article" (id, "revisionId", "articleNumber", title, "contentText", "sortOrder")
              VALUES ($1, $2, 3, '학점인정', $3, 3)
            `, [id3, revId, text3]);
          }

          if (text4) {
            const checkArt4 = await pool.query(`SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = 4`, [revId]);
            if (checkArt4.rows.length === 0) {
              const id4 = "art_3_3_20_rev_" + revId + "_art4";
              await pool.query(`
                INSERT INTO "Article" (id, "revisionId", "articleNumber", title, "contentText", "sortOrder")
                VALUES ($1, $2, 4, '원격수업의 개설 및 운영', $3, 4)
              `, [id4, revId, text4]);
            }
          }
        }

        const art5Res = await pool.query(`
          SELECT id, "contentText" FROM "Article" 
          WHERE "revisionId" = $1 AND "articleNumber" = 5 AND "contentText" LIKE '%제6조(출석관리)%'
        `, [revId]);

        if (art5Res.rows.length > 0) {
          const art5 = art5Res.rows[0];
          const rawText = art5.contentText;
          const marks = [
            { num: 5, title: "시수인정", tag: "제5조(시수인정)" },
            { num: 6, title: "출석관리", tag: "제6조(출석관리)" },
            { num: 7, title: "평가관리", tag: "제7조(평가관리)" },
            { num: 8, title: "원격수업관리위원회 구성", tag: "제8조(원격수업관리위원회 구성)" },
            { num: 9, title: "<삭제>", tag: "제9조 <삭제" },
            { num: 10, title: "콘텐츠 개발 및 지원", tag: "제10조(콘텐츠 개발 및 지원)" },
            { num: 11, title: "원격수업의 관리 및 운영", tag: "제11조(원격수업의 관리 및 운영)" },
            { num: 12, title: "다른 규정과의 관계", tag: "제12조(다른 규정과의 관계)" },
            { num: 13, title: "지식재산권", tag: "제13조(지식재산권)" },
            { num: 13, title: "의2(정보보호에 관한 사항)", tag: "제13조의2(정보보호에 관한 사항)" },
            { num: 14, title: "담당 부서", tag: "제14조(담당 부서)" },
            { num: 15, title: "적용제외", tag: "제15조(적용제외)" },
            { num: 8001, title: "부칙", tag: "부 칙(제정 2019. 1. 28)" }
          ];

          for (let i = 0; i < marks.length; i++) {
            const cur = marks[i];
            const startIdx = rawText.indexOf(cur.tag);
            if (startIdx === -1) continue;
            let endIdx = rawText.length;
            if (i < marks.length - 1) {
              const nextIdx = rawText.indexOf(marks[i + 1].tag, startIdx);
              if (nextIdx !== -1) endIdx = nextIdx;
            }
            const snippet = rawText.slice(startIdx, endIdx).trim();
            const sortOrder = cur.num === 13 && cur.title.includes("의2") ? 13.5 : cur.num;

            if (i === 0) {
              await pool.query(`UPDATE "Article" SET "contentText" = $1, "title" = $2, "sortOrder" = $3 WHERE id = $4`, [snippet, cur.title, sortOrder, art5.id]);
            } else {
              const checkExist = await pool.query(`SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" = $2 AND "title" = $3`, [revId, cur.num, cur.title]);
              if (checkExist.rows.length === 0) {
                const newId = "art_3_3_20_rev_" + revId + "_art_" + cur.num + (cur.title.includes("의2") ? "_sub2" : "");
                await pool.query(`
                  INSERT INTO "Article" (id, "revisionId", "articleNumber", title, "contentText", "sortOrder")
                  VALUES ($1, $2, $3, $4, $5, $6)
                `, [newId, revId, cur.num, cur.title, snippet, sortOrder]);
              }
            }
          }
        }

        await pool.query(`UPDATE "Article" SET "sortOrder" = 1 WHERE "revisionId" = $1 AND "articleNumber" = 1`, [revId]);
        results.updated.remoteLectureFixed = true;
      }
    } catch (err: any) {
      results.updated.remoteLectureError = err.message;
    }

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
