import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const missingRes = await pool.query(`
    SELECT a.id, a."articleNumber", a.title, r.title as "ruleTitle", att."fileUrl"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    LEFT JOIN "Attachment" att ON att."ruleId" = r.id
    WHERE a."contentJson"::text LIKE '%시스템 오류로 조항 본문이 유실되었습니다%'
  `);

  const uniqueHwps = new Set();
  for (const row of missingRes.rows) {
    if (row.fileUrl) {
      const filename = decodeURIComponent(row.fileUrl.split('/').pop());
      uniqueHwps.add(filename);
    }
  }

  const scriptLines = [
    '$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding',
    '$hwp = New-Object -ComObject HWPFrame.HwpObject',
    '$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")', 
    '$hwp.XHwpWindows.Item(0).Visible = $false',
    '$outDir = "E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_texts"',
    'if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }'
  ];

  for (const filename of uniqueHwps) {
    const hwpPath = `E:\\예원예술대학교_규정관리시스템\\public\\files\\rules\\${filename}`;
    const txtPath = `E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_texts\\${filename}.txt`;
    
    scriptLines.push(`Write-Host "Converting ${filename}"`);
    scriptLines.push(`if (Test-Path '${hwpPath}') {`);
    scriptLines.push(`  $hwp.Open('${hwpPath}', "HWP", "forceopen:true")`);
    scriptLines.push(`  $hwp.SaveAs('${txtPath}', "TEXT", "")`); // Using 3 args to fix overload error
    scriptLines.push(`  $hwp.Clear(1)`);
    scriptLines.push(`} else { Write-Host "File not found: ${hwpPath}" }`);
  }
  
  scriptLines.push('$hwp.Quit()');
  
  fs.writeFileSync('convert_hwps.ps1', '\ufeff' + scriptLines.join('\n'), 'utf8');
  console.log('convert_hwps.ps1 created for ' + uniqueHwps.size + ' files.');

} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
