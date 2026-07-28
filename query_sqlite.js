const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite');
console.log(db.prepare("SELECT id FROM Category LIMIT 5").all());
console.log(db.prepare("SELECT id FROM Department LIMIT 5").all());
