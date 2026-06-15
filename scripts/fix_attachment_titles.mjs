import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';

async function run() {
  console.log("Fetching attachments...");
  const output = execSync('npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, title FROM Attachment" --json').toString();
  
  let rows = [];
  try {
    const parsed = JSON.parse(output);
    rows = parsed[0].results;
  } catch (err) {
    console.error("Failed to parse DB output");
    return;
  }

  const updates = [];

  for (const row of rows) {
    const originalTitle = row.title;
    let cleanTitle = originalTitle;
    let changed = false;

    // Pattern 1: [별첨] 3-3-14 [별첨1] 학생현장실습.pdf -> [별첨1] 학생현장실습.pdf
    const match1 = originalTitle.match(/^\[(?:별지|별표|별첨|전문|서식)\]\s*[\d-]+\s*\[([^\]]+)\]\s*(.*)$/);
    if (match1) {
      cleanTitle = `[${match1[1]}] ${match1[2]}`;
      changed = true;
    } else {
      // Pattern 2: [별첨] 3-3-14 학생현장실습.pdf -> [별첨] 학생현장실습.pdf
      // But only for non-전문 types? Wait, if it's [별첨] or [별지], we want to strip the rule number.
      // If it's [전문], we leave the rule number!
      const match2 = originalTitle.match(/^\[(별지|별표|별첨|서식)\]\s*[\d-]+\s*(.*)$/);
      if (match2) {
        cleanTitle = `[${match2[1]}] ${match2[2]}`;
        changed = true;
      }
    }

    if (changed) {
      updates.push(`UPDATE "Attachment" SET title = '${cleanTitle.replace(/'/g, "''")}' WHERE id = '${row.id}';`);
    }
  }

  console.log(`Found ${updates.length} files to rename.`);
  if (updates.length > 0) {
    const sqlPath = "fix_titles.sql";
    fs.writeFileSync(sqlPath, updates.join('\n'));
    console.log("Applying updates to D1...");
    execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=${sqlPath}`);
    fs.unlinkSync(sqlPath);
    console.log("Done.");
  }
}

run().catch(console.error);
