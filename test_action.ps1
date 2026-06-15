$ErrorActionPreference = "Continue"
$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp') | Out-Null
$hwp.XHwpWindows.Item(0).Visible = $true

$file = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
$pdfPath = "F:\예원예술대학교_규정관리시스템\test_action.pdf"

$hwp.Open($file, "HWP", "forceopen:true") | Out-Null

$act = $hwp.CreateAction("FileSaveAsPdf")
$pset = $act.CreateSet()
$act.GetDefault($pset)
$pset.SetItem("FileName", $pdfPath)
$pset.SetItem("Format", "PDF")
$act.Execute($pset) | Out-Null

$hwp.Quit()
