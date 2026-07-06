require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  client.query(`SELECT title, "contentJson", "contentText" FROM "Article" WHERE title LIKE '%교내장학금 종류와 지급액%' LIMIT 1`)
    .then(res => {
      console.log(JSON.stringify(res.rows[0], null, 2));
      client.end();
    })
    .catch(console.error);
});
