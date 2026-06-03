import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env' });

const scriptLines = [
  '$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding',
  '$hwp = New-Object -ComObject HWPFrame.HwpObject',
  '$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")', 
  '$hwp.XHwpWindows.Item(0).Visible = $false',
  '$outDir = "E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_texts"',
  'if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }'
];

const filename = "1-0-1_학교법인_예원예술대학교_정관.hwp";
const hwpPath = `E:\\예원예술대학교_규정관리시스템\\public\\files\\rules\\${filename}`;
const txtPath = `E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_texts\\${filename}.txt`;

scriptLines.push(`Write-Host "Converting ${filename}"`);
scriptLines.push(`if (Test-Path '${hwpPath}') {`);
scriptLines.push(`  $hwp.Open('${hwpPath}', "HWP", "forceopen:true")`);
scriptLines.push(`  $hwp.SaveAs('${txtPath}', "TEXT", "")`); // 3 arguments!
scriptLines.push(`  $hwp.Clear(1)`);
scriptLines.push(`} else { Write-Host "File not found: ${hwpPath}" }`);

scriptLines.push('$hwp.Quit()');

fs.writeFileSync('convert_hwps2.ps1', '\ufeff' + scriptLines.join('\n'), 'utf8');
console.log('convert_hwps2.ps1 created.');
