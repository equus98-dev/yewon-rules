$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.XHwpWindows.Item(0).Visible = $false
$file = Get-ChildItem "F:\예원예술대학교_규정관리시스템\public\attachments\*1-0-4*.hwp" | Select-Object -First 1
Write-Host "Opening $($file.FullName)"
$success = $hwp.Open($file.FullName, "HWP", "forceopen:true")
if ($success) {
    $hwp.InitScan(0, 0, 0, 0, 0, 0) | Out-Null
    $text = ""
    $hwp.GetText([ref]$text) | Out-Null
    Write-Host "Text extracted:"
    Write-Host $text
    $hwp.ReleaseScan() | Out-Null
} else {
    Write-Host "Failed to open."
}
$hwp.Quit()
