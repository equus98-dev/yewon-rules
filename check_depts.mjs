import pg from 'pg';
import { config } from 'dotenv';
config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query('SELECT id, name, code, "sortOrder" FROM "Department" ORDER BY "sortOrder" ASC');
console.log(JSON.stringify(r.rows, null, 2));
await pool.end();
