import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  
  const artsRes = await client.query(`
    SELECT a.id, a."contentText", a."contentJson", r."enactmentDate", r."effectiveDate" 
    FROM "Article" a
    JOIN "Revision" r ON a."revisionId" = r.id
    WHERE a."articleNumber" >= 8000 AND a."articleNumber" < 9000
  `);

  let count = 0;
  for (const art of artsRes.rows) {
    const enacted = new Date(art.enactmentDate);
    const effective = new Date(art.effectiveDate);
    if (isNaN(enacted.getTime()) || isNaN(effective.getTime())) continue;

    const enactedStr = `${enacted.getFullYear()}. ${enacted.getMonth() + 1}. ${enacted.getDate()}.`;
    const effectiveStrFull = `${effective.getFullYear()}년 ${effective.getMonth() + 1}월 ${effective.getDate()}일`;

    let newText = art.contentText;
    let changed = false;

    // 1. <신설 ...> 또는 <개정 ...> 또는 <전부개정 ...> 날짜를 enactmentDate로 
    if (/<(신설|개정|전부개정|일부개정)\s+\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?>/.test(newText)) {
      const replaced = newText.replace(/(<(?:신설|개정|전부개정|일부개정)\s+)\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?(>)/g, `$1${enactedStr}$2`);
      if (replaced !== newText) {
        newText = replaced;
        changed = true;
      }
    }

    // 2. 시행일 텍스트 치환 (yyyy년 m월 d일)
    // 예: 이 규정은 2026년 6월 30일부터 시행한다. -> effectiveDate로 치환
    if (/이\s*(?:규정은|세칙은|지침은|내규는|기준은)\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일부터\s*시행한다/g.test(newText)) {
      const replaced = newText.replace(/(이\s*(?:규정은|세칙은|지침은|내규는|기준은)\s*)\d{4}년\s*\d{1,2}월\s*\d{1,2}일(부터\s*시행한다)/g, `$1${effectiveStrFull}$2`);
      if (replaced !== newText) {
        newText = replaced;
        changed = true;
      }
    }

    if (changed) {
      count++;
      // Update DB
      const newJson = newText.split('\n').filter((l: string) => l.trim().length > 0).map((l: string) => ({ type: "paragraph", text: l.trim() }));
      await client.query(`UPDATE "Article" SET "contentText" = $1, "contentJson" = $2 WHERE id = $3`, [newText, JSON.stringify(newJson), art.id]);
    }
  }

  console.log(`Updated dates in ${count} addendums.`);
  await client.end();
}

run().catch(console.error);
