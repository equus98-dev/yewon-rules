const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a."contentText", a."contentJson", a.title
    FROM "Article" a 
    WHERE a.id = '6b7798ba-a7e2-44f5-ba51-13cd2aad7e3b'
  `);
  
  const a = res.rows[0];
  const contentJson = a.contentJson;
  const contentText = a.contentText;
  
  const rawLines = [];
  let contentArr = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
  for (const item of contentArr) {
    let itemText = item.text || "";
    let raw = "";
    if (item.type === "article" && item.num) {
      raw = (item.num + " " + itemText).trim();
    } else {
      raw = itemText;
    }
    if (!raw) continue;
    raw = raw.replace(/^(?:부\s*칙\s*)+/, "").trim();
    if (raw) rawLines.push(raw);
  }
  
  let fullText = rawLines.join('\n');
  if (!fullText && contentText) {
    fullText = contentText.replace(/^(?:부\s*칙\s*)+/, "").trim();
  }
  
  console.log('FULL_TEXT:', fullText);
  
  const clauses = fullText.split('\n');
  const cleanedClauses = [];
  for (let i = 0; i < clauses.length; i++) {
    let c = clauses[i].trim();
    if (!c || c.match(/^\d+$/)) continue;
    cleanedClauses.push(c);
  }
  
  console.log('CLEANED:', cleanedClauses);
  await client.end();
}
run();
