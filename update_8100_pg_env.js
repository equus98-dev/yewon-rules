const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const contentText = `부 칙
1.(시행일) 이 정관은 2000년 12월 27일부터 시행한다.
2.(교직원징계에 대한 경과조치) 이 정관 시행 당시 교직원징계원위원회에 계류중인 징계사건은 징계사유 발생 당시의 정관 규정에 의한다.
3.(교원에 대한 경과조치) 이 정관 시행당시 예원대학교 소속 교직원은 이 정관에 의하여 임용된 것으로 본다.
4.(일반직원에 대한 경과조치) 이 정관 시행당시 종전의 규정에 의하여 별표 1,2의 각 직급에 임용된 자는 이 정관에 의하여 임용된 것으로 본다.`;

  const contentHtml = `<p>부 칙</p><p>1.(시행일) 이 정관은 2000년 12월 27일부터 시행한다.</p><p>2.(교직원징계에 대한 경과조치) 이 정관 시행 당시 교직원징계원위원회에 계류중인 징계사건은 징계사유 발생 당시의 정관 규정에 의한다.</p><p>3.(교원에 대한 경과조치) 이 정관 시행당시 예원대학교 소속 교직원은 이 정관에 의하여 임용된 것으로 본다.</p><p>4.(일반직원에 대한 경과조치) 이 정관 시행당시 종전의 규정에 의하여 별표 1,2의 각 직급에 임용된 자는 이 정관에 의하여 임용된 것으로 본다.</p>`;

  const res = await client.query(
    'UPDATE "Article" SET "contentText" = $1, "contentHtml" = $2 WHERE id = $3 RETURNING id',
    [contentText, contentHtml, '6b7798ba-a7e2-44f5-ba51-13cd2aad7e3b']
  );

  console.log("Updated article successfully:", res.rows[0]);
  
  await client.end();
}

main().catch(console.error);
