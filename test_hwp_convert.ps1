$sourceDir = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음"
$targetDir = Join-Path $sourceDir "PDF"

if (-Not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

$hwp = New-Object -ComObject HWPFrame.HwpObject

$files = Get-ChildItem -Path $sourceDir -Filter *.hwp -File | Select-Object -First 1

foreach ($file in $files) {
    $pdfName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".pdf"
    $pdfPath = Join-Path $targetDir $pdfName
    
    Write-Host "Converting: $($file.Name) to $pdfPath"
    
    # Open
    $hwp.Open($file.FullName, "HWP", "forceopen:true") | Out-Null
    
    # Save as PDF
    # 2nd arg: "PDF"
    $hwp.SaveAs($pdfPath, "PDF", "") | Out-Null
    
    $hwp.Clear(1) | Out-Null
}

$hwp.Quit()
Write-Host "Test Done!"
