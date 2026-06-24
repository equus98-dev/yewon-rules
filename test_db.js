const db = require('better-sqlite3')('dev.db'); const row = db.prepare('SELECT * FROM Article WHERE title LIKE ''%자산의 구분%''').get(); console.log(JSON.stringify(row, null, 2));
