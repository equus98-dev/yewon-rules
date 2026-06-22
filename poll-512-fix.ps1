$url = "https://yewon-rules.pages.dev/api/fix-512"
$attempt = 0

while ($true) {
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get
        if ($response -and $response.success) {
            Write-Host "Success!"
            Write-Host ($response | ConvertTo-Json -Depth 5)
            break
        }
        Write-Host "Wait... response was: "
        Write-Host ($response | ConvertTo-Json -Depth 5)
    } catch {
        Write-Host "Waiting for deployment... attempt $attempt"
    }
    $attempt++
    Start-Sleep -Seconds 5
}
