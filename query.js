const { Client } = require('pg');
const client = new Client({ user: 'yewon_user', host: 'localhost', database: 'yewon_rules', password: 'yewon', port: 5432 });
client.connect().then(() => client.query(`SELECT article_number, title, content_text FROM rule_articles WHERE rule_id = 'ba1e19c0-9eec-48cc-bd08-a20bc46b5158' AND (article_number = '4' OR article_number = '19')`)).then(res => { console.log(JSON.stringify(res.rows, null, 2)); return client.end(); }).catch(e => console.error(e));
