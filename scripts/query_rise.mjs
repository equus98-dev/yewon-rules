import { execSync } from 'child_process';

const sqlRule = `SELECT id, title FROM Rule WHERE title LIKE '%RISE%';`;
const sqlRule2 = `SELECT id, title FROM Rule WHERE title LIKE '%사업단%';`;

try {
  const raw1 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlRule}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("RISE Rule:", raw1);
} catch (e) {
  console.error("Error finding RISE rule:", e.message);
}

try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlRule2}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("사업단 Rule:", raw2);
} catch (e) {
  console.error("Error finding 사업단 rule:", e.message);
}
