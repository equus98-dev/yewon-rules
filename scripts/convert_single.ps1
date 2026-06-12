param (
    [string]$sourcePath,
    [string]$targetPath
)

$hwp = $null
try {
    $hwp = New-Object -ComObject HWPFrame.HwpObject
    $hwp.XHwpWindows.Item(0).Visible = $false
    $success = $hwp.Open($sourcePath, "HWP", "forceopen:true")
    if ($success) {
        $hwp.SaveAs($targetPath, "PDF", "")
        Write-Host "Success"
    } else {
        Write-Host "FailOpen"
    }
} catch {
    Write-Host "Error: $_"
} finally {
    if ($hwp) {
        $hwp.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($hwp) | Out-Null
    }
}
