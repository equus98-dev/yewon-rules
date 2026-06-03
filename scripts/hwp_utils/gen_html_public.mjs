import fs from 'fs';
import path from 'path';

try {
  const dirPath = 'E:\\예원예술대학교_규정관리시스템\\public\\files\\rules\\';
  const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.hwp'));

  const scriptLines = [
    '$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding',
    '$hwp = New-Object -ComObject HWPFrame.HwpObject',
    '$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")', 
    '$hwp.XHwpWindows.Item(0).Visible = $false',
    '$outDir = "E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html"',
    'if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }'
  ];

  for (const filename of files) {
    const hwpPath = path.join(dirPath, filename);
    const htmlPath = `E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\${filename}.htm`;
    
    scriptLines.push(`Write-Host "Converting ${filename}"`);
    scriptLines.push(`if (Test-Path '${hwpPath}') {`);
    scriptLines.push(`  $hwp.Open('${hwpPath}', "HWP", "forceopen:true")`);
    scriptLines.push(`  $hwp.SaveAs('${htmlPath}', "HTML", "")`);
    scriptLines.push(`  $hwp.Clear(1)`);
    scriptLines.push(`} else { Write-Host "File not found: ${hwpPath}" }`);
  }
  
  scriptLines.push('$hwp.Quit()');
  
  fs.writeFileSync('scripts/hwp_utils/convert_all_html_public.ps1', '\ufeff' + scriptLines.join('\n'), 'utf8');
  console.log('convert_all_html_public.ps1 created for ' + files.length + ' files.');

} catch (e) {
  console.error(e.message);
}
