const { Pool } = require('pg');
const fs = require('fs');

async function run() {
  const p = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/yewon' });
  const res = await p.query(`SELECT id, title, "ruleNumber" FROM "Rule" WHERE "ruleNumber" = '3-1-4'`);
  console.log(res.rows);
  const ruleId = res.rows[0].id;
  
  // Insert the two attachments
  const hwpName = '[별표] 위임전결권 구분표.hwp';
  const pdfName = '[별표] 위임전결권 구분표.pdf';

  // We'll just fake the fileUrl since we are not uploading to R2 here, but we will copy them to public folder for testing
  fs.copyFileSync('docs/rules/별지 및 별표 모음/3-1-4 [별표] 위임전결권 구분표.hwp', 'public/' + hwpName);
  fs.copyFileSync('docs/rules/별지 및 별표 모음/3-1-4 [별표] 위임전결권 구분표.pdf', 'public/' + pdfName);

  await p.query(
    `INSERT INTO "Attachment" (id, "ruleId", title, "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
    ['uuid1111-1111-1111-1111-111111111111', ruleId, hwpName, '/' + hwpName, 147456, 'HWP']
  );
  await p.query(
    `INSERT INTO "Attachment" (id, "ruleId", title, "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
    ['uuid2222-2222-2222-2222-222222222222', ruleId, pdfName, '/' + pdfName, 239500, 'PDF']
  );

  console.log('Inserted!');
  await p.end();
}
run();
