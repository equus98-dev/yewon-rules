import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.jagpwxgasudlnaoxfroe',
  password: 'Tmtmfh0022$&*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // Get all rule IDs
    const rulesRes = await pool.query('SELECT id, title FROM "Rule" ORDER BY "ruleNumber"');
    console.log('Total rules in DB:', rulesRes.rows.length);
    
    // Test each rule via the live API and track failures
    const failures = [];
    const successes = [];
    
    for (let i = 0; i < Math.min(rulesRes.rows.length, 30); i++) {
      const rule = rulesRes.rows[i];
      try {
        const res = await fetch(`https://yewon-rules.pages.dev/api/rules/${rule.id}`);
        if (res.status !== 200) {
          failures.push({ id: rule.id, title: rule.title, status: res.status });
          process.stdout.write('F');
        } else {
          const data = await res.json();
          if (data.error) {
            failures.push({ id: rule.id, title: rule.title, error: data.error });
            process.stdout.write('E');
          } else {
            successes.push(rule.id);
            process.stdout.write('.');
          }
        }
      } catch(e) {
        failures.push({ id: rule.id, title: rule.title, error: e.message });
        process.stdout.write('X');
      }
    }
    
    console.log('\n\nSuccesses:', successes.length);
    console.log('Failures:', failures.length);
    if (failures.length > 0) {
      console.log('\nFailed rules:');
      failures.forEach(f => console.log(` - [${f.status || f.error}] ${f.title} (${f.id})`));
    }
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();
