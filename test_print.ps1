$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp') | Out-Null
$hwp.SetMessageBoxMode(0x20000)
$hwp.XHwpWindows.Item(0).Visible = $false

$file = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
$pdfPath = "F:\예원예술대학교_규정관리시스템\test_print.pdf"

if (Test-Path $pdfPath) { Remove-Item $pdfPath }

$hwp.Open($file, "HWP", "forceopen:true") | Out-Null

# Force layout pagination
$hwp.MovePos(3) | Out-Null
Start-Sleep -Seconds 1

$act = $hwp.CreateAction("Print")
$pset = $act.CreateSet()
$act.GetDefault($pset)

$pset.SetItem("PrintMethod", 0)
$pset.SetItem("PrintToFile", 1)
$pset.SetItem("PrinterName", "Hancom PDF")
$pset.SetItem("FileName", $pdfPath)

$act.Execute($pset) | Out-Null
Start-Sleep -Seconds 2

$hwp.Clear(1) | Out-Null
$hwp.Quit()
