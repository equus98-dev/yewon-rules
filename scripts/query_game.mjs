import { execSync } from 'child_process';

const sql1 = `SELECT id, title FROM Rule WHERE title LIKE '%게임%';`;
const raw1 = execSync(
  `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sql1}"`,
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
);
console.log(raw1);

// We assume there's one matching Rule ID. Let's just find it manually first.
