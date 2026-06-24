const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  
  const res = await client.query('SELECT a.id, a."articleNumber", a."title", a."contentJson", a."contentText" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\' ORDER BY a."sortOrder"');
  
  for (let row of res.rows) {
    const text = row.contentJson?.[0]?.text;
    const num = row.contentJson?.[0]?.num;
    if (text && text.includes('①') && !text.startsWith('①')) {
      const match = text.match(/^([^①]+)(①.*)/);
      if (match) {
          const restOfTitle = match[1];
          const newText = match[2];
          const newNum = (num + restOfTitle).replace(/\s+/g, ' ').trim();
          
          let cJson = row.contentJson;
          cJson[0].num = newNum;
          cJson[0].text = newText;
          
          // Also try to fix contentText if it exists
          let cText = row.contentText;
          // It's safer to just let the contentJson take precedence, but let's try to fix cText too
          if (cText) {
             cText = cText.replace(new RegExp(num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?' + restOfTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), newNum);
          }
          
          await client.query('UPDATE "Article" SET "contentJson" = $1, "contentText" = $2 WHERE id = $3', [JSON.stringify(cJson), cText, row.id]);
          console.log(`Fixed Article ${row.articleNumber}: new num is ${newNum}`);
      }
    }
  }
  
  await client.end();
}
run();
