import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * 깨진 문자(U+FFFD, ��) 수정 스크립트
 * SQL 파일을 사용하여 긴 텍스트 업데이트 문제를 해결
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
  const raw = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --file="${sqlFilePath}"`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  return raw;
}

const tmpSqlPath = join(process.cwd(), 'scripts', '_tmp_fix.sql');

async function main() {
  console.log('=== 깨진 문자(U+FFFD) 수정 시작 ===\n');

  // 모든 깨진 문자 포함 기사 가져오기
  const articles = wranglerQuery(`SELECT id, articleNumber, title, contentText FROM Article WHERE contentText LIKE '%\uFFFD%'`);
  console.log(`총 ${articles.length}개 기사에 깨진 문자 발견\n`);

  let fixedCount = 0;

  for (const art of articles) {
    let text = art.contentText;
    let changed = false;

    // 문서관리 규정: "例(예)" 한자 깨짐 수정
    // 패턴: (�� 텍스트) → (예 텍스트)
    if (text.includes('(�� ')) {
      text = text.replace(/\(��\s+/g, '(예 ');
      changed = true;
      console.log(`  📝 Article #${art.articleNumber} ${art.title}: "例" → "예" 변환`);
    }

    // 점선 패턴 (서식/표에서 사용): ������...→ ··················
    const dotMatches = text.match(/\uFFFD{4,}/g);
    if (dotMatches) {
      text = text.replace(/\uFFFD{4,}/g, '··················');
      changed = true;
      console.log(`  📝 Article #${art.articleNumber} ${art.title}: 점선 패턴 수정`);
    }

    // 나머지 단독 깨진 문자: 서식/인장 관련 → 제거
    if (text.includes('\uFFFD')) {
      text = text.replace(/\uFFFD/g, '');
      changed = true;
      console.log(`  📝 Article #${art.articleNumber} ${art.title}: 나머지 깨진 문자 제거`);
    }

    if (changed) {
      // SQL 파일로 UPDATE 실행 (이스케이핑 문제 방지)
      const escapedText = text.replace(/'/g, "''");
      const sql = `UPDATE Article SET contentText = '${escapedText}' WHERE id = '${art.id}';`;
      writeFileSync(tmpSqlPath, sql, 'utf8');
      
      try {
        wranglerExecFile(tmpSqlPath);
        fixedCount++;
        console.log(`  ✅ 수정 완료\n`);
      } catch (e) {
        console.error(`  ❌ 수정 실패: ${e.message}\n`);
      }
    }
  }

  // 임시 파일 정리
  try { unlinkSync(tmpSqlPath); } catch {}

  // 최종 확인
  console.log('=== 수정 후 확인 ===');
  const remaining = wranglerQuery(`SELECT COUNT(*) as cnt FROM Article WHERE contentText LIKE '%\uFFFD%'`);
  console.log(`수정된 기사: ${fixedCount}건`);
  console.log(`남은 깨진 문자 포함 기사: ${remaining[0]?.cnt || 0}건`);
}

main().catch(e => {
  console.error('Error:', e);
  try { unlinkSync(tmpSqlPath); } catch {}
  process.exit(1);
});
