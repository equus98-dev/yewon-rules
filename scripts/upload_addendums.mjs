import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import crypto from 'crypto';

  const PDF_DIR = path.join('F:\\예원예술대학교_규정관리시스템\\docs\\rules\\별지 및 별표 모음');

async function run() {
  console.log("Fetching rules from D1...");
  const dbOutput = execSync('npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, ruleNumber FROM Rule" --json', { encoding: 'utf-8' });
  
  let dbResult;
  try {
    const rawLines = dbOutput.trim().split('\n');
    let jsonStr = dbOutput;
    // D1 might output some extra text before JSON. Try to find the JSON array.
    if (!dbOutput.trim().startsWith('[')) {
      const match = dbOutput.match(/\[.*\]/s);
      if (match) jsonStr = match[0];
    }
    dbResult = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse D1 output:", dbOutput);
    return;
  }
  
  const rules = dbResult[0]?.results || [];
  const ruleMap = new Map();
  for (const r of rules) {
    ruleMap.set(r.ruleNumber, r.id);
  }
  console.log(`Loaded ${rules.length} rules.`);

  const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.hwp'));
  console.log(`Found ${files.length} HWP files.`);

  const affectedRuleIds = new Set();
  const uploads = [];

  for (const file of files) {
    // Expected format: "1-0-1 [별표1] 법인 직원 정원.hwp"
    const match = file.match(/^([\d-]+)\s+(.*)\.hwp$/i);
    if (!match) {
      console.log("Skipping unparseable file:", file);
      continue;
    }
    
    const ruleNumber = match[1];
    let title = match[2]; // e.g. "[별표1] 법인 직원 정원"
    
    // Some files might have multiple spaces, the regex captures everything after the first space to title.
    const ruleId = ruleMap.get(ruleNumber);
    if (!ruleId) {
      console.log("Rule not found for number:", ruleNumber, "File:", file);
      continue;
    }
    
    affectedRuleIds.add(ruleId);
    
    const ext = 'HWP';
    const stats = fs.statSync(path.join(PDF_DIR, file));
    const fileSize = stats.size;
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.hwp`;
    
    uploads.push({
      localPath: path.join(PDF_DIR, file),
      fileName: uniqueFileName,
      title: title,
      ruleId: ruleId,
      fileSize: fileSize,
      fileType: ext
    });
  }

  console.log(`Mapped ${uploads.length} files to ${affectedRuleIds.size} rules.`);

  // Upload to R2 in batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < uploads.length; i += BATCH_SIZE) {
    const batch = uploads.slice(i, i + BATCH_SIZE);
    console.log(`Uploading batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(uploads.length/BATCH_SIZE)}...`);
    
    await Promise.all(batch.map(upload => {
      return new Promise((resolve, reject) => {
        const cmd = `npx.cmd wrangler r2 object put yewon-rules-storage/${upload.fileName} --file "${upload.localPath}" --content-type "application/x-hwp"`;
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error(`Error uploading ${upload.fileName}:`, stderr);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }));
  }

  console.log("All files uploaded to R2.");

  console.log("Preparing DB SQL...");
  
  const ruleIdList = Array.from(affectedRuleIds).map(id => `'${id}'`).join(',');
  const sqlCommands = [];

  for (const up of uploads) {
    const id = crypto.randomUUID();
    const publicUrl = `/api/files/${up.fileName}`;
    const safeTitle = up.title.replace(/'/g, "''"); // escape single quotes
    sqlCommands.push(`INSERT INTO "Attachment" (id, "ruleId", title, "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt") VALUES ('${id}', '${up.ruleId}', '${safeTitle}', '${publicUrl}', ${up.fileSize}, '${up.fileType}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
  }

  const sqlFilePath = path.join(process.cwd(), 'scripts', 'bulk_insert_addendums.sql');
  fs.writeFileSync(sqlFilePath, sqlCommands.join('\n'), 'utf-8');
  
  console.log("Executing SQL on D1...");
  try {
    execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file="${sqlFilePath}"`, { stdio: 'inherit' });
    console.log("Database updated successfully.");
  } catch(e) {
    console.error("Failed to execute D1 SQL.");
  }
}

run().catch(console.error);
