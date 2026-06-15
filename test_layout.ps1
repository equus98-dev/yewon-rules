$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp') | Out-Null
$hwp.XHwpWindows.Item(0).Visible = $false

$file = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
$pdfPath = "F:\예원예술대학교_규정관리시스템\test_layout.pdf"

if (Test-Path $pdfPath) { Remove-Item $pdfPath }

$hwp.Open($file, "HWP", "forceopen:true") | Out-Null

# Force layout by moving cursor to end and back
$hwp.MovePos(3, 0, 0) | Out-Null
$hwp.MovePos(2, 0, 0) | Out-Null

$hwp.SaveAs($pdfPath, "PDF", "") | Out-Null

$hwp.Clear(1) | Out-Null
$hwp.Quit()
