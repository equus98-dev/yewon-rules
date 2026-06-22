$file = "E:\예원예술대학교_규정관리시스템\docs\rules\5-1-2 학생생활관 관생생활 수칙.hwp"
$txt = "E:\예원예술대학교_규정관리시스템\512.txt"

$hwp = New-Object -ComObject HWPFrame.HwpObject
$success = $hwp.RegisterModule("FilePathCheckDLL", "raonkhwp")
$hwp.XHwpWindows.Item(0).Visible = $false
$hwp.Open($file, "HWP", "forceopen:true") | Out-Null

$hwp.SaveAs($txt, "TEXT", "") | Out-Null

$hwp.Clear(1) | Out-Null
$hwp.Quit()
Write-Host "Done!"
