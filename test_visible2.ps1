$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp') | Out-Null
$hwp.XHwpWindows.Item(0).Visible = $true

$file = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
$pdfPath = "F:\예원예술대학교_규정관리시스템\test_visible2.pdf"

if (Test-Path $pdfPath) { Remove-Item $pdfPath }

$hwp.Open($file, "HWP", "forceopen:true") | Out-Null
Start-Sleep -Seconds 2

$hwp.SaveAs($pdfPath, "PDF", "") | Out-Null
Start-Sleep -Seconds 1
$hwp.Clear(1) | Out-Null
$hwp.Quit()
