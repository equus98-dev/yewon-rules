param (
    [string]$sourcePath,
    [string]$targetPath
)

$hwp = $null
try {
    $hwp = New-Object -ComObject HWPFrame.HwpObject
    $hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")
    $hwp.XHwpWindows.Item(0).Visible = $false
    $success = $hwp.Open($sourcePath, "HWP", "forceopen:true")
    if ($success) {
        $hwp.SaveAs($targetPath, "HTML", "")
        Write-Host "Success"
    } else {
        Write-Host "FailOpen"
    }
} catch {
    Write-Host "Error: $_"
} finally {
    if ($hwp) {
        $hwp.Clear(1)
        $hwp.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($hwp) | Out-Null
    }
}
