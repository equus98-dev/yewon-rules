const { Database } = require('sqlite-async');
async function run() {
  const db = await Database.open('f:/이명근/예원예술대학교_규정관리시스템/database.sqlite');
  const rule = await db.get('SELECT id FROM Rule WHERE title LIKE "%문화예술HRD연구소%"');
  if (rule) {
    const revs = await db.all('SELECT * FROM Revision WHERE "ruleId" = ? ORDER BY "enactmentDate" DESC, "createdAt" DESC', [rule.id]);
    console.log(JSON.stringify(revs, null, 2));
  }
}
run().catch(console.error);
