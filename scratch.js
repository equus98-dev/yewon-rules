const { Pool } = require(process.cwd() + '/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT "contentJson", "contentText" FROM "Article" WHERE "articleNumber" = 6 LIMIT 1')
  .then(res => { 
    console.log(JSON.stringify(res.rows[0].contentJson, null, 2)); 
    pool.end(); 
  });
