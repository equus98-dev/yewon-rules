const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const sourceDir = path.join(__dirname, '../docs/rules/별지 및 별표 모음');
const targetDir = path.join(__dirname, '../public/attachments');
const sqlOutputFile = path.join(__dirname, 'insert_attachments.sql');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(sqlOutputFile, '');

const files = fs.readdirSync(sourceDir);
let successCount = 0;
let errorCount = 0;
let missingRules = [];

console.log(`Found ${files.length} files in source directory.`);
console.log('Fetching rules from production D1 database...');

let rulesJson;
try {
    const result = execSync('npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, ruleNumber FROM Rule;" --json', { encoding: 'utf-8' });
    rulesJson = JSON.parse(result);
} catch (err) {
    console.error('Failed to fetch rules from D1:', err.stderr || err.message);
    process.exit(1);
}

const ruleMap = {};
if (Array.isArray(rulesJson) && rulesJson.length > 0 && rulesJson[0].results) {
    for (const r of rulesJson[0].results) {
        ruleMap[r.ruleNumber] = r.id;
    }
}
console.log(`Fetched ${Object.keys(ruleMap).length} rules from D1.`);

for (const file of files) {
    if (!file.toLowerCase().endsWith('.hwp')) continue;

    const match = file.match(/^([0-9]+-[0-9]+-[0-9]+(-[0-9]+)?)/);
    if (!match) {
        console.log(`Could not parse rule number from: ${file}`);
        errorCount++;
        continue;
    }

    const ruleNumber = match[1];
    const ruleId = ruleMap[ruleNumber];
    
    if (!ruleId) {
        if (!missingRules.includes(ruleNumber)) missingRules.push(ruleNumber);
        errorCount++;
        continue;
    }

    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    const stats = fs.statSync(targetPath);
    
    const uuid = crypto.randomUUID();
    const fileUrl = `/attachments/${encodeURIComponent(file)}`;
    
    const sql = `INSERT INTO "Attachment" ("id", "ruleId", "title", "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt") VALUES ('${uuid}', '${ruleId}', '${file.replace(/'/g, "''")}', '${fileUrl}', ${stats.size}, 'HWP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;
    fs.appendFileSync(sqlOutputFile, sql);
    
    successCount++;
}

console.log(`\nImport completed.`);
console.log(`Successfully mapped and copied: ${successCount} files`);
console.log(`Errors / Unmapped files: ${errorCount}`);
if (missingRules.length > 0) {
    console.log(`Missing rules in DB for numbers: ${missingRules.join(', ')}`);
}

