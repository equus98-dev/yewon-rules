const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./prisma/dev.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  db.each("SELECT contentText FROM Article WHERE contentText LIKE '%제19조의5%'", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log("TEXT START===");
    console.log(row.contentText);
    console.log("TEXT END===");
  });
});

db.close();
