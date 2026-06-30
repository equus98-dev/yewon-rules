import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT r.id, r.title, r."ruleNumber", r."initialSound", r.status, r."categoryId",
        c.name AS "categoryName", r."departmentId", d.name AS "departmentName",
        (SELECT "versionName" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "latestVersion",
        (SELECT "enactmentDate" FROM "Revision" WHERE "ruleId" = r.id ORDER BY version DESC LIMIT 1) AS "enactmentDate"
      FROM "Rule" r
      LEFT JOIN "Category" c ON r."categoryId" = c.id
      LEFT JOIN "Department" d ON r."departmentId" = d.id
      ORDER BY r.title ASC
    `);
    console.log('Rows:', res.rows.length);
  } catch (error) {
    console.error('Error:', error);
  }
  await client.end();
}
run().catch(console.error);
