// Rapid-fire test: hit the same failing rule 10 times quickly
import { Pool } from '@neondatabase/serverless';

const ruleId = 'b45e669f-0247-4098-aec4-59bb1848b0cf'; // 일반직원 징계규정 (was failing)

async function testRapidFire() {
  console.log('=== Rapid-fire test: 10 requests in quick succession ===');
  const results = [];
  
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    const res = await fetch(`https://yewon-rules.pages.dev/api/rules/${ruleId}`);
    const elapsed = Date.now() - start;
    results.push({ i: i+1, status: res.status, ms: elapsed });
    process.stdout.write(res.status === 200 ? '.' : 'F');
  }
  
  console.log('\n');
  results.forEach(r => console.log(`  Request ${r.i}: status=${r.status}, ${r.ms}ms`));
  
  const failures = results.filter(r => r.status !== 200);
  console.log(`\nResult: ${results.length - failures.length}/${results.length} success`);
}

async function testMultipleRules() {
  console.log('\n=== Test: 10 different rules one after another (no pause) ===');
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  const rulesRes = await pool.query('SELECT id FROM "Rule" ORDER BY "ruleNumber" LIMIT 10');
  await pool.end();
  
  const ids = rulesRes.rows.map(r => r.id);
  const results = [];
  
  for (const id of ids) {
    const start = Date.now();
    const res = await fetch(`https://yewon-rules.pages.dev/api/rules/${id}`);
    const elapsed = Date.now() - start;
    results.push({ id, status: res.status, ms: elapsed });
    process.stdout.write(res.status === 200 ? '.' : 'F');
  }
  
  console.log('\n');
  results.forEach(r => console.log(`  ${r.id.slice(0,8)}: status=${r.status}, ${r.ms}ms`));
  
  const failures = results.filter(r => r.status !== 200);
  console.log(`\nResult: ${results.length - failures.length}/${results.length} success`);
}

async function testParallel() {
  console.log('\n=== Test: 10 rules fetched in PARALLEL simultaneously ===');
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  const rulesRes = await pool.query('SELECT id FROM "Rule" ORDER BY "ruleNumber" LIMIT 10');
  await pool.end();
  
  const ids = rulesRes.rows.map(r => r.id);
  
  const start = Date.now();
  const results = await Promise.all(
    ids.map(id => fetch(`https://yewon-rules.pages.dev/api/rules/${id}`).then(r => ({ id, status: r.status })))
  );
  const elapsed = Date.now() - start;
  
  results.forEach(r => process.stdout.write(r.status === 200 ? '.' : 'F'));
  console.log(`  (${elapsed}ms total)`);
  
  const failures = results.filter(r => r.status !== 200);
  console.log(`Result: ${results.length - failures.length}/${results.length} success`);
  if (failures.length > 0) {
    console.log('Failures:', failures.map(f => f.id.slice(0,8)));
  }
}

(async () => {
  await testRapidFire();
  await testMultipleRules();
  await testParallel();
})();
