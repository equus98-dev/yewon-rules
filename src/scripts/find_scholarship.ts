import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, title FROM "Rule" WHERE title LIKE '%장학금%'`);
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
