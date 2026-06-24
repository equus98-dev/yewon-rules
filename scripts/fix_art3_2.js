const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  
  // Find Article 3-2
  const res = await client.query('SELECT a.id, a."contentJson", a."contentText" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\' AND a."articleNumber" = 3 ORDER BY a."sortOrder"');
  
  const art3_2 = res.rows[1]; // Index 1 is Article 3-2
  
  if (art3_2 && art3_2.contentJson[0].num === "제3조의2(학부(과)") {
     let cJson = art3_2.contentJson;
     cJson[0].num = "제3조의2(학부(과) 및 정원)";
     cJson[0].text = cJson[0].text.replace(/^및 정원\)\s*/, "");
     
     let cText = art3_2.contentText;
     cText = cText.replace(/^제3조의2\(학부\(과\)\n및 정원\)/, "제3조의2(학부(과) 및 정원)");
     
     await client.query('UPDATE "Article" SET "contentJson" = $1, "contentText" = $2 WHERE id = $3', [JSON.stringify(cJson), cText, art3_2.id]);
     console.log("Fixed Article 3-2");
  } else {
     console.log("Could not find Article 3-2 or it is already fixed.");
  }
  
  await client.end();
}
run();
