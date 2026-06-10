const db = require('better-sqlite3')('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);
