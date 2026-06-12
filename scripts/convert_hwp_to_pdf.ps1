$ErrorActionPreference = "Stop"

$attachmentsDir = Join-Path $PSScriptRoot "..\public\attachments"
$hwpFiles = Get-ChildItem -Path $attachmentsDir -Filter "*.hwp"

if ($hwpFiles.Count -eq 0) {
    Write-Host "No HWP files found in $attachmentsDir"
    exit 0
}

Write-Host "Found $($hwpFiles.Count) HWP files. Attempting to start Hancom Office Automation..."

try {
    $hwp = New-Object -ComObject HwpFrame.HwpObject
    $hwp.XHwpWindows.Item(0).Visible = $false
    Write-Host "Hancom Office started successfully."
} catch {
    Write-Host "Error: Failed to start Hancom Office. Please ensure Hancom Office is installed."
    Write-Host $_.Exception.Message
    exit 1
}

$successCount = 0
$errorCount = 0

foreach ($file in $hwpFiles) {
    $pdfPath = [System.IO.Path]::ChangeExtension($file.FullName, ".pdf")
    
    if (Test-Path $pdfPath) {
        Write-Host "Skipping (PDF already exists): $($file.Name)"
        continue
    }

    Write-Host "Converting: $($file.Name)..."
    
    try {
        # Open HWP file
        $hwp.Open($file.FullName, "HWP", "forceopen:true") | Out-Null
        
        # Save as PDF
        # PDF format code is "PDF"
        $hwp.SaveAs($pdfPath, "PDF", "") | Out-Null
        
        # Close document
        $hwp.Clear(1) | Out-Null
        
        $successCount++
    } catch {
        Write-Host "Failed to convert $($file.Name): $($_.Exception.Message)"
        $errorCount++
        try {
            $hwp.Clear(1) | Out-Null
        } catch {}
    }
}

Write-Host "`nConversion completed."
Write-Host "Successfully converted: $successCount files"
Write-Host "Errors: $errorCount"

try {
    $hwp.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($hwp) | Out-Null
} catch {}
