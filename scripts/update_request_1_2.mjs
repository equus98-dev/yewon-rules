import { execSync } from 'child_process';

const sqlCategories = `
UPDATE Category SET name = '제5편 부속/부설기관/센터' WHERE name = '제5편 부속/부설기관';
UPDATE Category SET name = '제1장 부속기관/센터' WHERE name = '제1장 부속기관';
UPDATE Category SET name = '제2장 부설연구소/센터' WHERE name = '제2장 부설연구소';
`;

try {
  const raw1 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlCategories.replace(/\n/g, ' ')}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Categories updated:", raw1);
} catch (e) {
  console.error("Error updating categories:", e.message);
}

const sqlStudentRule = `SELECT id, title FROM Rule WHERE title LIKE '%학생회칙%';`;
try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlStudentRule}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Student Rule ID query:", raw2);
} catch (e) {
  console.error("Error finding student rule:", e.message);
}
