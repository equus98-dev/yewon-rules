import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const schemaRes = await pool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('Rule', 'Revision')
  `);
  console.log('Schema:');
  schemaRes.rows.forEach(r => console.log(`  ${r.table_name}.${r.column_name} (${r.data_type})`));

  const contentRes = await pool.query(`
    SELECT r.id, r.title, rv."contentJson" as "rvJson", r."contentJson" as "ruleJson"
    FROM "Rule" r
    LEFT JOIN "Revision" rv ON rv."ruleId" = r.id
    WHERE r.title = '학교법인 예원예술대학교 정관'
  `);
  console.log('\nData lengths:');
  contentRes.rows.forEach(r => {
    console.log(`  Rule: ${r.title}`);
    console.log(`    rvJson type: ${typeof r.rvJson}, length: ${r.rvJson ? JSON.stringify(r.rvJson).length : 0}`);
    console.log(`    ruleJson type: ${typeof r.ruleJson}, length: ${r.ruleJson ? JSON.stringify(r.ruleJson).length : 0}`);
  });
} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
