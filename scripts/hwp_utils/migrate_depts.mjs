import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     // 기획처 -> 기획조정처
     await pool.query(`UPDATE "Rule" SET "departmentId" = '67af6863-efea-40e2-818c-0c0a78dc7d21' WHERE "departmentId" = 'ff8d91f0-141f-4427-9e70-db94c4b7b1c2'`);
     await pool.query(`DELETE FROM "Department" WHERE id = 'ff8d91f0-141f-4427-9e70-db94c4b7b1c2'`);
     
     // 교무처 -> 교학지원처
     await pool.query(`UPDATE "Rule" SET "departmentId" = '3e0b42f2-7f0e-42b0-9533-0007e6b6a3bc' WHERE "departmentId" = '053df3fe-1d60-41d8-9dfe-c957ece3ef12'`);
     await pool.query(`DELETE FROM "Department" WHERE id = '053df3fe-1d60-41d8-9dfe-c957ece3ef12'`);
     
     // 총무처 -> 행정지원처
     await pool.query(`UPDATE "Rule" SET "departmentId" = '297bec42-b9d0-4072-acec-c00b01ca2773' WHERE "departmentId" = 'eac41e09-6b5c-4b5b-8bca-2997c7ec8303'`);
     await pool.query(`DELETE FROM "Department" WHERE id = 'eac41e09-6b5c-4b5b-8bca-2997c7ec8303'`);
     
     // 학생처 -> 입학홍보처로 이름 변경
     await pool.query(`UPDATE "Department" SET name = '입학홍보처' WHERE id = '65476709-5b33-4b6b-b27a-d7a476026659'`);
     
     console.log('Migration Complete');
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
