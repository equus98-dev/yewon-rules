$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule("FilePathCheckDLL", "FilePathCheckerModule")
$success = $hwp.Open("F:\예원예술대학교_규정관리시스템\docs\rules\2-0-2 예원예술대학교 학칙.hwp", "HWP", "forceopen:true")
if (!$success) {
    Write-Host "Failed to open document"
    $hwp.Quit()
    exit
}

$hwp.InitScan(0, 0)
$text = ""
$textPtr = ""
$ret = 1
while ($ret -ne 0) {
    $ret = $hwp.GetText([ref]$textPtr)
    if ($ret -ne 0) {
        $text += $textPtr
    }
}
$hwp.ReleaseScan()
$hwp.Quit()

$text | Out-File -FilePath "docs\202_text.txt" -Encoding utf8
Write-Host "Done"
