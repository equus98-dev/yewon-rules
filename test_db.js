const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

client.connect().then(async () => {
    try {
        const res = await client.query('SELECT * FROM "Article" LIMIT 1;');
        console.log("Success:", res.rows);
    } catch(e) { console.log("Error:", e.message) }
}).finally(() => client.end());
