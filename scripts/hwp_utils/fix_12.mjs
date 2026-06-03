import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT id, "contentJson" FROM "Article" WHERE id = '921f25f5-3dae-46e6-ba97-79c05f0ab673'`);
     let items = res.rows[0].contentJson;
     
     // Fix the first item
     if (items[0].type === 'article' && items[0].num === '제12조') {
       items[0].num = '제12조의2(예ㆍ결산보고 및 공시)';
       items[0].text = '법인은 매 회계연도 개시전에 예산을, 매 회계연도 종료후에는 결산을 관할청에보고하고 공시하여야 한다. (본조신설 2006.12.18)';
     }
     
     await pool.query(
       `UPDATE "Article" SET title = '예ㆍ결산보고 및 공시', "contentJson" = $1 WHERE id = '921f25f5-3dae-46e6-ba97-79c05f0ab673'`,
       [JSON.stringify(items)]
     );
     console.log('Fixed Article 12-2');
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
