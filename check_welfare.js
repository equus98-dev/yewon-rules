const { Pool } = require('pg');

async function check() {
  const p = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/yewon' });
  const res = await p.query(`
    SELECT r.title, a.id, a."articleNumber", a."contentText", a."contentJson"
    FROM "Rule" r
    JOIN "Revision" rev ON r.id = rev."ruleId" AND rev."isCurrent" = true
    JOIN "Article" a ON rev.id = a."revisionId"
    WHERE r.title LIKE '%사회복지대학원 학사운영 규정%' 
      AND (a."articleNumber" = 43 OR a."articleNumber" = 78 OR a."articleNumber" >= 9000)
    ORDER BY a."articleNumber"
  `);
  console.log('사회복지대학원 학사운영 규정:', res.rows);

  const res2 = await p.query(`
    SELECT r.title, a.id, a."articleNumber", a."contentText", a."contentHtml"
    FROM "Rule" r
    JOIN "Revision" rev ON r.id = rev."ruleId" AND rev."isCurrent" = true
    JOIN "Article" a ON rev.id = a."revisionId"
    WHERE r.title LIKE '%일반대학원 학사운영 규정%'
      AND a."contentHtml" LIKE '%제6학기%'
  `);
  console.log('일반대학원 학사운영 규정 HTML:', res2.rows.map(r => ({ id: r.id, title: r.title, html: r.contentHtml })));

  await p.end();
}
check();
