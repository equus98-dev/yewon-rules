const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  
  // Find Article 3
  const res = await client.query('SELECT a.id, a."contentJson", a."contentText" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\' AND a."articleNumber" = 3 ORDER BY a."sortOrder" LIMIT 1');
  
  const art3 = res.rows[0]; 
  
  if (art3 && art3.contentJson[0].num === "제3조(편제)") {
     let cJson = art3.contentJson;
     cJson[0].text = cJson[0].text.replace(/,/g, ", "); // Add space after all commas
     cJson[0].text = cJson[0].text.replace(/, \s+/g, ", "); // Clean up any double spaces
     
     let cText = art3.contentText;
     cText = cText.replace(/,/g, ", ");
     cText = cText.replace(/, \s+/g, ", ");
     
     await client.query('UPDATE "Article" SET "contentJson" = $1, "contentText" = $2 WHERE id = $3', [JSON.stringify(cJson), cText, art3.id]);
     console.log("Fixed Article 3 spaces");
  } else {
     console.log("Could not find Article 3.");
  }
  
  await client.end();
}
run();
