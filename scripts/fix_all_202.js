const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  
  const res = await client.query('SELECT a.id, a."articleNumber", a."title", a."contentJson", a."contentText" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\'');
  
  for (let row of res.rows) {
    if (!row.contentJson) continue;
    let cJson = row.contentJson;
    let changed = false;

    // Fix missing spaces after commas in Article 3
    if (row.articleNumber === 3 && cJson[0] && cJson[0].text) {
        let oldText = cJson[0].text;
        let newText = oldText.replace(/,/g, ", ").replace(/, \s+/g, ", ");
        if (oldText !== newText) {
            cJson[0].text = newText;
            changed = true;
        }
    }

    // Fix nested parenthesis parsing error
    const text = cJson[0]?.text;
    const num = cJson[0]?.num;
    if (text && text.includes('①') && !text.startsWith('①')) {
      const match = text.match(/^([^①]+)(①.*)/);
      if (match) {
          const restOfTitle = match[1];
          const newText = match[2];
          const newNum = (num + restOfTitle).replace(/\s+/g, ' ').trim();
          cJson[0].num = newNum;
          cJson[0].text = newText;
          changed = true;
      }
    }

    if (changed) {
        await client.query('UPDATE "Article" SET "contentJson" = $1 WHERE id = $2', [JSON.stringify(cJson), row.id]);
        console.log(`Fixed Article ${row.articleNumber} in revision ${row.id}`);
    }
  }
  
  await client.end();
}
run();
