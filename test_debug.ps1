$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp') | Out-Null

# SetMessageBoxMode to suppress warnings
# 0x20000 = HwpMessageBoxType::mbtAuto (suppress all message boxes)
# Actually, SetMessageBoxMode might not exist. Let's try without it first but with Visible=$true to see the dialog.
$hwp.XHwpWindows.Item(0).Visible = $true

$file = "F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
$pdfPath = "F:\예원예술대학교_규정관리시스템\test_debug.pdf"

if (Test-Path $pdfPath) { Remove-Item $pdfPath }

# forceopen:true should suppress read-only warnings
$hwp.Open($file, "HWP", "forceopen:true") | Out-Null
Start-Sleep -Seconds 2

# Actually, the format 'PDF' in SaveAs often creates an empty 5KB file in some Hancom versions unless PrintToPdf is used.
$hwp.SaveAs($pdfPath, "PDF", "") | Out-Null
Start-Sleep -Seconds 2

$hwp.Clear(1) | Out-Null
$hwp.Quit()
