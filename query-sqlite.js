const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./prisma/dev.db', (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  db.each("SELECT contentText FROM Article WHERE contentText LIKE '%제27조%' AND contentText LIKE '%②%' LIMIT 1;", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log('--- Article 27 ---');
    console.log(row.contentText);
  });
});

db.close();
