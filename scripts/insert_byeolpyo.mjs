import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * 성인학습자 학사 운영규정 - 별표 1 졸업이수학점 테이블 삽입 스크립트
 */

function wranglerQuery(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const raw = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${escaped}"`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const jsonStart = raw.indexOf('[');
  const jsonEnd = raw.lastIndexOf(']') + 1;
  if (jsonStart === -1) return [];
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd));
  return parsed[0]?.results || [];
}

function wranglerExecFile(sqlFilePath) {
  execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --file="${sqlFilePath}"`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
}

const tmpSqlPath = join(process.cwd(), 'scripts', '_tmp_byeolpyo.sql');

async function main() {
  // 1. revisionId 가져오기
  const revRows = wranglerQuery(`SELECT rev.id as revisionId FROM Revision rev WHERE rev.ruleId = '3e68dbcb-2050-4dc0-852b-8f0ed1845713' ORDER BY rev.createdAt DESC LIMIT 1`);
  if (revRows.length === 0) {
    console.error('Revision not found');
    process.exit(1);
  }
  const revisionId = revRows[0].revisionId;
  console.log(`Revision ID: ${revisionId}`);

  // 2. 기존 9000번대 별표 확인
  const existing = wranglerQuery(`SELECT id FROM Article WHERE revisionId = '${revisionId}' AND articleNumber >= 9000`);
  if (existing.length > 0) {
    console.log(`기존 별표 ${existing.length}개 발견 - 삭제 후 재삽입`);
    for (const e of existing) {
      wranglerQuery(`DELETE FROM Article WHERE id = '${e.id}'`);
    }
  }

  // 3. 별표 1 졸업이수학점 테이블 HTML 생성
  const tableHtml = `<p style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:16px">[별표 1 졸업이수학점]</p>
<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #000;table-layout:fixed;width:100%;max-width:700px;margin:0 auto;">
<tbody>
<tr>
<td rowspan="2" valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold;width:10%">학 번</td>
<td colspan="1" valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold;width:10%">교 양</td>
<td colspan="3" valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold;width:30%">전 공</td>
<td rowspan="2" valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold;width:12%">일반<br>(자유)</td>
<td rowspan="2" valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold;width:10%">졸업<br>학점</td>
<td rowspan="2" valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold;width:13%">비 고</td>
</tr>
<tr>
<td valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold">소계</td>
<td valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold">전필</td>
<td valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold">전선</td>
<td valign="middle" bgcolor="#e5e5e5" style="border:1px solid #000;text-align:center;padding:6px;font-weight:bold">소계</td>
</tr>
<tr>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">2025</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">10</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">12</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">18</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">30</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">70</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">110</td>
<td valign="middle" style="border:1px solid #000;text-align:center;padding:6px">성인학습자</td>
</tr>
</tbody>
</table>`;

  const artId = randomUUID();
  const now = new Date().toISOString();

  // contentText는 표의 텍스트 요약
  const contentText = `[별표 1 졸업이수학점]\n학번 | 교양(소계) | 전필 | 전선 | 전공(소계) | 일반(자유) | 졸업학점 | 비고\n2025 | 10 | 12 | 18 | 30 | 70 | 110 | 성인학습자`;

  // 4. INSERT SQL 파일 생성
  const escapedHtml = tableHtml.replace(/'/g, "''");
  const escapedText = contentText.replace(/'/g, "''");
  const contentJson = JSON.stringify([{ type: "text", num: "", text: contentText }]).replace(/'/g, "''");

  const sql = `INSERT INTO Article (id, revisionId, chapter, section, articleNumber, title, contentText, contentJson, contentHtml, sortOrder, createdAt, updatedAt) VALUES ('${artId}', '${revisionId}', NULL, NULL, 9001, '〔별표 1 졸업이수학점〕', '${escapedText}', '${contentJson}', '${escapedHtml}', 9001, '${now}', '${now}');`;

  writeFileSync(tmpSqlPath, sql, 'utf8');

  try {
    wranglerExecFile(tmpSqlPath);
    console.log('✅ 별표 1 졸업이수학점 테이블 삽입 완료');
    console.log(`   Article ID: ${artId}`);
    console.log(`   Article Number: 9001`);
  } catch (e) {
    console.error('❌ 삽입 실패:', e.message);
  }

  // 정리
  try { unlinkSync(tmpSqlPath); } catch {}

  // 5. 부칙 8015의 contentText에서 별표 테이블 HTML 제거 (중복 방지)
  const addendum = wranglerQuery(`SELECT id, contentText FROM Article WHERE id = '7c83acc9-3f3b-44d9-82ea-610f71748bfc'`);
  if (addendum.length > 0) {
    const origText = addendum[0].contentText;
    // 별표 테이블 시작점 이전까지만 보존
    const tableStart = origText.indexOf('〔별표 1 졸업이수학점〕');
    if (tableStart !== -1) {
      const newText = origText.substring(0, tableStart).trim();
      const escapedNewText = newText.replace(/'/g, "''");
      const updateSql = `UPDATE Article SET contentText = '${escapedNewText}' WHERE id = '7c83acc9-3f3b-44d9-82ea-610f71748bfc';`;
      writeFileSync(tmpSqlPath, updateSql, 'utf8');
      try {
        wranglerExecFile(tmpSqlPath);
        console.log('✅ 부칙 8015에서 별표 테이블 텍스트 분리 완료');
      } catch (e) {
        console.error('❌ 부칙 업데이트 실패:', e.message);
      }
      try { unlinkSync(tmpSqlPath); } catch {}
    }
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
