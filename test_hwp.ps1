$hwp = New-Object -ComObject HWPFrame.HwpObject
if ($hwp) {
    Write-Host "Installed"
    $hwp.Quit()
} else {
    Write-Host "Not installed"
}
