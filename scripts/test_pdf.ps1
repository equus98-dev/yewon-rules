$ErrorActionPreference = "Continue"
try {
    $path = "F:\예원예술대학교_규정관리시스템\public\attachments\1-0-4 [별지 제1-1호 서식 확인서].hwp"
    $pdfPath = "F:\예원예술대학교_규정관리시스템\public\attachments\1-0-4 [별지 제1-1호 서식 확인서].pdf"
    
    $hwp = New-Object -ComObject HWPFrame.HwpObject
    $hwp.XHwpWindows.Item(0).Visible = $true
    
    $success = $hwp.Open($path, "HWP", "forceopen:true")
    if ($success) {
        Write-Host "Opened HWP successfully"
        $hwp.SaveAs($pdfPath, "PDF", "")
        Write-Host "Saved PDF"
        Start-Sleep -Seconds 1
    } else {
        Write-Host "Failed to open HWP"
    }
} catch {
    Write-Host "Global Error: $_"
} finally {
    if ($hwp) {
        $hwp.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($hwp) | Out-Null
    }
}
