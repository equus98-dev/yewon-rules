$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp') | Out-Null
$file = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
$pdfPath = "F:\예원예술대학교_규정관리시스템\test3.pdf"

if (Test-Path $pdfPath) { Remove-Item $pdfPath }

$hwp.Open($file, "HWP", "forceopen:true") | Out-Null
$hwp.MovePos(3) | Out-Null
$hwp.SaveAs($pdfPath, "PDF", "download:true") | Out-Null
$hwp.Quit()
