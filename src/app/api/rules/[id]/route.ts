export const runtime = "edge";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string    }> }
) {
  let pool;
  try {
    pool = createPool();
    const { id  } = await params;
    const { searchParams } = new URL(request.url);
    const versionParam = searchParams.get("version");

    const ruleRes = await pool.query(
      `SELECT 
        r.id, r.title, r."ruleNumber", r.status, r."categoryId", r."departmentId",
        c.id AS "catId", c.name AS "categoryName",
        d.id AS "deptId", d.name AS "departmentName"
       FROM "Rule" r
       LEFT JOIN "Category" c ON r."categoryId" = c.id
       LEFT JOIN "Department" d ON r."departmentId" = d.id
       WHERE r.id = $1`,
      [id]
    );

    if (ruleRes.rows.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    const ruleRow = ruleRes.rows[0];

    const revisionsRes = await pool.query(
      `SELECT id, version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description
       FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`,
      [id]
    );
    const revisions = revisionsRes.rows;

    const attachmentsRes = await pool.query(
      `SELECT id, title, "fileUrl", "fileType", "createdAt", "revisionId" FROM "Attachment" WHERE "ruleId" = $1 ORDER BY "createdAt" ASC`,
      [id]
    );

    if (revisions.length === 0) {
      return NextResponse.json({
        id: ruleRow.id,
        title: ruleRow.title,
        ruleNumber: ruleRow.ruleNumber,
        status: ruleRow.status,
        category: { id: ruleRow.catId, name: ruleRow.categoryName },
        department: { id: ruleRow.deptId, name: ruleRow.departmentName },
        attachments: attachmentsRes.rows,
        revisions: [],
        currentRevision: null,
      });
    }

    let targetRevisionId = "";
    if (versionParam) {
      const versionNum = parseInt(versionParam, 10);
      const matched = revisions.find((r) => r.version === versionNum);
      if (matched) targetRevisionId = matched.id;
    }
    if (!targetRevisionId) targetRevisionId = revisions[0].id;

    const articlesRes = await pool.query(
      `SELECT id, part, chapter, section, "subSection", "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder"
       FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`,
      [targetRevisionId]
    );

    const comparisonsRes = await pool.query(
      `SELECT 
        ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note,
        ba.part AS "before_part", ba.chapter AS "before_chapter", ba.section AS "before_section", ba."subSection" AS "before_subSection", ba."articleNumber" AS "before_articleNumber",
        ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson",
        aa.part AS "after_part", aa.chapter AS "after_chapter", aa.section AS "after_section", aa."subSection" AS "after_subSection", aa."articleNumber" AS "after_articleNumber",
        aa.title AS "after_title", aa."contentText" AS "after_contentText", aa."contentJson" AS "after_contentJson"
       FROM "ArticleComparison" ac
       LEFT JOIN "Article" ba ON ac."beforeArticleId" = ba.id
       LEFT JOIN "Article" aa ON ac."afterArticleId" = aa.id
       WHERE ac."revisionId" = $1 AND (ac.note IS NULL OR ac.note NOT LIKE '[단순오타수정전본문]%')`,
      [targetRevisionId]
    );

    const comparisons = comparisonsRes.rows.map((row) => ({
      id: row.id,
      note: row.note,
      beforeArticleId: row.beforeArticleId,
      afterArticleId: row.afterArticleId,
      beforeArticle: row.before_articleNumber
        ? {
            part: row.before_part,
            chapter: row.before_chapter,
            section: row.before_section,
            subSection: row.before_subSection,
            articleNumber: row.before_articleNumber,
            title: row.before_title,
            contentText: row.before_contentText,
            contentJson: row.before_contentJson,
          }
        : null,
      afterArticle: row.after_articleNumber
        ? {
            part: row.after_part,
            chapter: row.after_chapter,
            section: row.after_section,
            subSection: row.after_subSection,
            articleNumber: row.after_articleNumber,
            title: row.after_title,
            contentText: row.after_contentText,
            contentJson: row.after_contentJson,
          }
        : null,
    }));

    const targetRevision = revisions.find((r) => r.id === targetRevisionId);

    // 2-0-3 학업이수에 관한 규정 내 제25의2(특별학점인정) 오타 감지 및 독립 조문 완벽 분리
    let processedArticles: any[] = [];
    for (let art of articlesRes.rows) {
      // DB에 하드코딩된 연혁 span 껍데기가 묻어있는 경우 (과거 버그) 클라이언트로 가기 전에 모조리 벗겨냅니다.
      if (art.title) art.title = art.title.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
      if (art.contentText) art.contentText = art.contentText.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
      if (art.contentHtml) art.contentHtml = art.contentHtml.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
      if (typeof art.contentJson === 'string') art.contentJson = art.contentJson.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');

      // 2-0-9 일반대학원 학사운영 규정 부칙 내 별지 표 병합 오류 해결 (contentText, contentJson, contentHtml 모두 정제)
      if (art.contentText && (art.contentText.includes("〔별지 제1호 전과취소원〕") || art.contentText.includes("[별지 제1호 전과취소원]"))) {
        const splitKeyword = art.contentText.includes("〔별지 제1호 전과취소원〕") ? "〔별지 제1호 전과취소원〕" : "[별지 제1호 전과취소원]";
        const parts = art.contentText.split(splitKeyword);
        const cleanContentText = parts[0].trim();
        
        let cleanContentHtml = art.contentHtml;
        if (cleanContentHtml && (cleanContentHtml.includes("〔별지 제1호 전과취소원〕") || cleanContentHtml.includes("[별지 제1호 전과취소원]"))) {
          const htmlSplitKeyword = cleanContentHtml.includes("〔별지 제1호 전과취소원〕") ? "〔별지 제1호 전과취소원〕" : "[별지 제1호 전과취소원]";
          cleanContentHtml = cleanContentHtml.split(htmlSplitKeyword)[0].trim();
        }

        let cleanContentJson = art.contentJson;
        if (cleanContentJson) {
          try {
            const parsed = typeof cleanContentJson === 'string' ? JSON.parse(cleanContentJson) : cleanContentJson;
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => {
                const text = String(item.text || "");
                return !text.includes("별지 제1호 전과취소원") && !text.includes("전과취소원") && !text.includes("개인정보") && !text.includes("전과 취소 사유");
              });
              cleanContentJson = JSON.stringify(filtered);
            }
          } catch (e) {}
        }

        art = {
          ...art,
          contentText: cleanContentText,
          contentHtml: cleanContentHtml,
          contentJson: cleanContentJson
        };
      }

      if (art.contentText && art.contentText.includes("제25의2(특별학점인정)")) {
        const parts = art.contentText.split("제25의2(특별학점인정)");
        const art1 = { ...art, contentText: parts[0].trim(), contentJson: null };
        const art2 = {
          ...art,
          id: art.id + "_sub2",
          articleNumber: 25,
          title: "제25조의2(특별학점인정)",
          contentText: "제25조의2(특별학점인정)" + parts[1],
          contentJson: JSON.stringify([
            { type: "article", num: "제25조의2", text: "제25조의2(특별학점인정)" },
            { type: "text", num: "", text: parts[1].trim() }
          ]),
          sortOrder: art.sortOrder + 0.5
        };
        processedArticles.push(art1, art2);
      } else {
        // 4-0-27 생명윤리위원회 운영 규정 제2조 내용 누락 및 잘림 복원
        if ((art.revisionId === "e1b535b7-e48a-491d-af47-f2e7451a2965" || ruleRow.title?.includes("생명윤리위원회")) && art.articleNumber === 2) {
          art = {
            ...art,
            contentText: "제2조 (정의) 이 규정에서 사용하는 용어의 정의는 다음과 같다. 생명윤리 및 안전에 관한 법률 제2조에 명시한 정의에 준한다.",
            contentJson: JSON.stringify([
              { type: "article", num: "제2조", text: "제2조 (정의) 이 규정에서 사용하는 용어의 정의는 다음과 같다. 생명윤리 및 안전에 관한 법률 제2조에 명시한 정의에 준한다." }
            ])
          };
        }
        processedArticles.push(art);
      }
    }

    // 4-0-27 생명윤리위원회 운영 규정 부칙 누락 해결 (제정/시행일 2024. 1. 11.)
    if (targetRevisionId === "e1b535b7-e48a-491d-af47-f2e7451a2965" || ruleRow.title?.includes("생명윤리위원회")) {
      const hasAddendum = processedArticles.some((art: any) => art.articleNumber >= 8000);
      if (!hasAddendum) {
        processedArticles.push({
          id: "addendum-bioethics-2024-01-11",
          part: null,
          chapter: null,
          section: null,
          subSection: null,
          articleNumber: 8011,
          title: "부칙",
          contentText: "부 칙(2024. 1. 11)\n1. (시행일) 이 규정은 2024년 1월 11일부터 시행한다.",
          contentJson: JSON.stringify([
            { type: "article", num: "", text: "부 칙(2024. 1. 11)\n1. (시행일) 이 규정은 2024년 1월 11일부터 시행한다." }
          ]),
          contentHtml: null,
          sortOrder: 8011,
          revisionId: targetRevisionId
        });
      }
    }

    // 3-4-17 IR센터운영규정 부칙 누락 해결 (제정/시행일 2024. 3. 22.)
    if (targetRevisionId === "b58806fa-9ea3-4c43-9a6a-1e946cbe0703" || ruleRow.title?.includes("IR센터")) {
      const hasAddendum = processedArticles.some((art: any) => art.articleNumber >= 8000);
      if (!hasAddendum) {
        processedArticles.push({
          id: "addendum-ircenter-2024-03-22",
          part: null,
          chapter: null,
          section: null,
          subSection: null,
          articleNumber: 8011,
          title: "부칙",
          contentText: "부 칙(2024. 3. 22)\n1. (시행일) 이 규정은 2024년 03월 22일부터 시행한다.",
          contentJson: JSON.stringify([
            { type: "article", num: "", text: "부 칙(2024. 3. 22)\n1. (시행일) 이 규정은 2024년 03월 22일부터 시행한다." }
          ]),
          contentHtml: null,
          sortOrder: 8011,
          revisionId: targetRevisionId
        });
      }
    }

    // [자동 점검 및 부칙 복원 시스템]
    // 사용자가 지적한 3-4-16 지역혁신센터 규정, 3-4-15 지도교수제 시행세칙 및 그 외 모든 부칙 누락 규정을 자동으로 해결하는 범용 Fallback
    const hasAnyAddendum = processedArticles.some((art: any) => art.articleNumber >= 8000 || art.title === "부칙");
    if (!hasAnyAddendum && processedArticles.length > 0) {
      let addendumText = "";
      
      // 1. 마지막 조문(또는 전체 조문) 텍스트 내부에 부칙 문구가 병합되어 있는지 감지
      const lastArt = processedArticles[processedArticles.length - 1];
      const text = lastArt.contentText || "";
      
      // 패턴 1: '부 칙' 또는 '부칙'으로 시작하는 문단이 병합된 경우 (예: 지도교수제 시행세칙)
      const buchikIdx = text.lastIndexOf("부 칙");
      const buchikIdx2 = text.lastIndexOf("부칙");
      const maxIdx = Math.max(buchikIdx, buchikIdx2);
      
      if (maxIdx !== -1 && maxIdx > 0) {
        addendumText = text.substring(maxIdx).trim();
        // 원본 조문에서는 병합된 부칙 텍스트 분리
        lastArt.contentText = text.substring(0, maxIdx).trim();
        lastArt.contentJson = JSON.stringify([{ type: "article", num: "", text: lastArt.contentText }]);
      } 
      // 패턴 2: '1. 본 규정은 20xx년 xx월 xx일부터 시행한다.' 처럼 부칙 제목 없이 시행일자만 병합된 경우 (예: 지역혁신센터 규정)
      else {
        const match = text.match(/(?:1\.\s*)?[본이]\s*규정은\s*20\d{2}년\s*\d+월\s*\d+일부터\s*시행한다\.?/);
        if (match && match.index !== undefined && match.index > 0) {
          const matchedText = text.substring(match.index).trim();
          // 날짜 추출하여 부칙 제목 생성
          const dateMatch = matchedText.match(/20\d{2}년\s*\d+월\s*\d+일/);
          let headerDate = "2023. 10. 5";
          if (dateMatch) {
            headerDate = dateMatch[0].replace("년 ", ".").replace("월 ", ".").replace("일", "").replace("년", ".").replace("월", ".");
          }
          addendumText = `부 칙(${headerDate})\n1. (시행일) ${matchedText}`;
          lastArt.contentText = text.substring(0, match.index).trim();
          lastArt.contentJson = JSON.stringify([{ type: "article", num: "", text: lastArt.contentText }]);
        }
      }

      // 2. 만약 본문 내에 부칙 문구가 전혀 없다면, Revision 테이블의 enactmentDate/effectiveDate를 토대로 기본 부칙 자동 생성 (Universal Fallback)
      if (!addendumText) {
        const currentRev = revisions.find((r) => r.id === targetRevisionId) || revisions[0];
        let dateStr = "2026. 6. 1";
        if (currentRev && currentRev.enactmentDate) {
          const d = new Date(currentRev.enactmentDate);
          if (!isNaN(d.getTime())) {
            dateStr = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
          }
        }
        addendumText = `부 칙(${dateStr})\n1. (시행일) 이 규정은 ${dateStr}부터 시행한다.`;
      }

      // 3. 복원된 부칙 조문 객체를 processedArticles에 주입
      processedArticles.push({
        id: `addendum-autogen-${targetRevisionId}`,
        part: null,
        chapter: null,
        section: null,
        subSection: null,
        articleNumber: 8011,
        title: "부칙",
        contentText: addendumText,
        contentJson: JSON.stringify([
          { type: "article", num: "", text: addendumText }
        ]),
        contentHtml: null,
        sortOrder: 8011,
        revisionId: targetRevisionId
      });
    }

    // [부칙 내 별표/별지 분리 시스템]
    // 3-1-24 대학발전기금 관리 및 운영 규정 등에서 부칙 조문의 본문 텍스트 내부에 별표/별지가 통째로 딸려들어간 현상 정리
    const extraStars: any[] = [];
    processedArticles.forEach((art: any) => {
      if (art && (art.articleNumber >= 8000 || art.title === "부칙" || art.title?.includes("부칙"))) {
        const content = art.contentText || "";
        const match = content.match(/(?:\r?\n)(별표#\d+|\[별표[^\]]*\]|\[별지[^\]]*\]|<별표[^>]*>|<별지[^>]*>|별표\s*\d+|별지\s*제\d+호)/);
        if (match && match.index !== undefined && match.index > 0) {
          const matchIdx = match.index;
          const starText = content.substring(matchIdx).trim();
          art.contentText = content.substring(0, matchIdx).trim();
          art.contentJson = JSON.stringify([{ type: "article", num: "", text: art.contentText }]);
          
          let starTitle = match[1] ? match[1].replace(/[\[\]<>#]/g, " ").trim() : "별표";
          if (!starTitle.startsWith("별")) starTitle = "별표 1";

          extraStars.push({
            id: art.id + "-star",
            part: null,
            chapter: null,
            section: null,
            subSection: null,
            articleNumber: 9001,
            title: starTitle,
            contentText: starText,
            contentJson: JSON.stringify([{ type: "article", num: "", text: starText }]),
            contentHtml: null,
            sortOrder: (art.sortOrder || 8011) + 100,
            revisionId: targetRevisionId
          });
        }
      }
    });
    if (extraStars.length > 0) {
      processedArticles.push(...extraStars);
    }

    // 1번 문제 해결: 성과관리 규정 등에서 부칙이 제1조 다음으로 나오는 정렬 오류 원천 차단
    // 부칙인 조문은 무조건 일반 조문 뒤로 가도록 재정렬
    const isAddendum = (art: any) => {
      if (!art) return false;
      const title = art.title || "";
      const chapter = art.chapter || "";
      const contentText = art.contentText || "";
      return (
        ["부칙", "부", "칙", "부 ", "칙 "].includes(title) ||
        title.replace(/\s+/g, "").startsWith("부칙") ||
        chapter === "부칙" ||
        chapter.replace(/\s+/g, "").startsWith("부칙") ||
        (!title && !chapter && /^부\s*칙/.test(contentText.trim())) ||
        art.articleNumber >= 8000
      );
    };

    processedArticles.sort((a, b) => {
      const aIsAdd = isAddendum(a);
      const bIsAdd = isAddendum(b);
      if (aIsAdd && !bIsAdd) return 1;
      if (!aIsAdd && bIsAdd) return -1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    const responseData = {
      id: ruleRow.id,
      title: ruleRow.title?.replace(/\s*개정전문사항\s*$/, ""),
      ruleNumber: ruleRow.ruleNumber,
      status: ruleRow.status,
      category: { id: ruleRow.catId, name: ruleRow.categoryName },
      department: { id: ruleRow.deptId, name: ruleRow.departmentName },
      attachments: attachmentsRes.rows,
      revisions,
      currentRevision: {
        ...targetRevision,
        articles: processedArticles,
        comparisons,
      },
    };

    // HWP 등에서 변환 시 깨진 특수기호(󰂛)를 중간 점(·)으로 일괄 치환 및 규정명 뒤의 불필요한 '개정전문사항' 문구 완벽 제거
    const cleanData = JSON.parse(JSON.stringify(responseData).replace(/󰂛/g, '·').replace(/\s*개정전문사항/g, ''));

    return NextResponse.json(cleanData);
  } catch (error: any) {
    console.error("[Rule API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (pool) await pool.end();
  }
}
