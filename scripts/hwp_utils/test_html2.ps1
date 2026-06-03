$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")
$hwp.XHwpWindows.Item(0).Visible = $false
$outDir = "E:\예원예술대학교_규정관리시스템\scratch\hwp_html"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp', "HWP", "forceopen:true")
  Write-Host "Saving as HTML..."
  $res = $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\정관.htm', "HTML", "")
  Write-Host "SaveAs Result: $res"
  $hwp.Clear(1)
}
$hwp.Quit()