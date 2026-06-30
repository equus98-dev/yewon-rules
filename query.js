const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/yewon' });
client.connect().then(() => client.query('SELECT * FROM "Revision" ORDER BY "createdAt" DESC LIMIT 5'))
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .finally(() => client.end());
