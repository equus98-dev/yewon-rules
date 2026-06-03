$hwp = New-Object -ComObject HWPFrame.HwpObject
if ($hwp) {
    Write-Host "HWP Installed"
    $hwp.Quit()
} else {
    Write-Host "HWP Not Installed"
}
