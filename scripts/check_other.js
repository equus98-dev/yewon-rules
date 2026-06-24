const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT a."articleNumber", a."title", a."contentJson" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\' ORDER BY a."sortOrder"');
  for (let row of res.rows) {
    const text = row.contentJson?.[0]?.text;
    const num = row.contentJson?.[0]?.num;
    if (text && text.includes('①') && !text.startsWith('①')) {
      console.log('Article ' + row.articleNumber + ' (' + row.title + ') has text before ①: ' + text.substring(0, 20));
    } else if (text && text.startsWith('①') && text.length > 50) {
      const firstWord = text.split(' ')[0];
      if (firstWord.length > 30) {
          console.log('Article ' + row.articleNumber + ' (' + row.title + ') has long no-space text: ' + firstWord.substring(0, 30));
      }
    }
    
    if (num && num.includes('(') && !num.endsWith(')')) {
        console.log('Article ' + row.articleNumber + ' (' + row.title + ') title parsing error: ' + num);
    }
  }
  await client.end();
}
run();
