$ErrorActionPreference = "Continue"

try {
    $hwp = New-Object -ComObject HWPFrame.HwpObject
    $hwp.XHwpWindows.Item(0).Visible = $false
    Write-Host "Hancom Office Started"

    $dirs = @(
        (Join-Path (Get-Location).Path "public\attachments"),
        (Join-Path (Get-Location).Path "public\rules")
    )

    foreach ($dir in $dirs) {
        if (Test-Path $dir) {
            $files = Get-ChildItem -Path $dir -Filter "*.hwp" -File
            foreach ($file in $files) {
                $pdfName = [System.IO.Path]::ChangeExtension($file.Name, ".pdf")
                $pdfPath = Join-Path $dir $pdfName
                
                $success = $hwp.Open($file.FullName, "HWP", "forceopen:true")
                if ($success) {
                    $hwp.SaveAs($pdfPath, "PDF", "")
                    Write-Host "Converted: $pdfName"
                    # Wait for saving to complete
                    Start-Sleep -Milliseconds 500
                } else {
                    Write-Host "Failed to open: $($file.FullName)"
                }
                # Clear document so next open works reliably
                $hwp.Clear(1) | Out-Null
            }
        }
    }
} catch {
    Write-Host "Error: $_"
} finally {
    if ($hwp) {
        $hwp.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($hwp) | Out-Null
    }
}
Write-Host "Done!"
