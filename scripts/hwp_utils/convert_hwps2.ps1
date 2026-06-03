$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")
$hwp.XHwpWindows.Item(0).Visible = $false
$outDir = "E:\예원예술대학교_규정관리시스템\scratch\hwp_texts"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }
Write-Host "Converting 1-0-1_학교법인_예원예술대학교_정관.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\1-0-1_학교법인_예원예술대학교_정관.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp" }
$hwp.Quit()