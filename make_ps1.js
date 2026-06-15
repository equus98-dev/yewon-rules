const fs = require('fs');

const script = `$sourceDir = "F:\\예원예술대학교_규정관리시스템\\docs\\rules\\별지 및 별표 모음"
$targetDir = Join-Path $sourceDir "PDF"

if (-Not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

$hwp = New-Object -ComObject HWPFrame.HwpObject

# Bypass security warning using RAON K DLL
$success = $hwp.RegisterModule("FilePathCheckDLL", "raonkhwp")
Write-Host "RegisterModule success: $success"

$hwp.XHwpWindows.Item(0).Visible = $false

$files = Get-ChildItem -Path $sourceDir -Filter *.hwp -File
$total = $files.Count
$count = 0

foreach ($file in $files) {
    $count++
    $pdfName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".pdf"
    $pdfPath = Join-Path $targetDir $pdfName
    
    if (Test-Path $pdfPath) {
        $stats = Get-Item $pdfPath
        if ($stats.Length -gt 6000) {
            Write-Host "Skipping ($count/$total): $($file.Name) (Already converted)"
            continue
        }
    }

    Write-Host "Converting ($count/$total): $($file.Name)"
    
    $hwp.Open($file.FullName, "HWP", "forceopen:true") | Out-Null
    $hwp.SaveAs($pdfPath, "PDF", "") | Out-Null
    $hwp.Clear(1) | Out-Null
}

$hwp.Quit()
Write-Host "Done!"`;

fs.writeFileSync('convert_hwp.ps1', '\uFEFF' + script, 'utf8');
