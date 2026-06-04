import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

async function main() {
  try {
    console.log('Fixing file types...');
    const result = await pool.query(
      `UPDATE "Attachment" SET "fileType" = 'HWP' WHERE "fileType" LIKE '%/%'`
    );
    console.log('Fixed records:', result.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
