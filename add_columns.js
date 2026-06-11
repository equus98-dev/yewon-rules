const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

client.connect().then(async () => {
    try {
        await client.query('ALTER TABLE "Article" ADD COLUMN part VARCHAR(255);');
        console.log("part added");
    } catch(e) { console.log(e.message) }

    try {
        await client.query('ALTER TABLE "Article" ADD COLUMN "subSection" VARCHAR(255);');
        console.log("subSection added");
    } catch(e) { console.log(e.message) }
    
    // Also add to ArticleComparison? No, ArticleComparison just points to Articles.
    // However, the rule api fetches Article columns... wait!
    
}).finally(() => client.end());
