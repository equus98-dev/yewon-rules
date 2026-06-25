$body = @{
    revisionId = "9a2adcca-29e8-47eb-809c-d5ceaed357e1"
    articles = @(
        @{
            articleNumber = 9001
            title = "부칙 (2023. 10. 05.)"
            contentText = "부칙(2023. 10. 05.)`n1. (시행일) 이 규정은 2023년 10월 05일부터 시행한다."
            contentJson = '[{"type":"article","num":"","text":"부칙(2023. 10. 05.) 1. (시행일) 이 규정은 2023년 10월 05일부터 시행한다."}]'
            sortOrder = 15
            chapter = "부칙"
        },
        @{
            articleNumber = 9002
            title = "부칙 (2026. 03. 18.)"
            contentText = "부칙(2026. 03. 18.)`n1. (시행일) 이 규정은 2026년 03월 18일부터 시행한다."
            contentJson = '[{"type":"article","num":"","text":"부칙(2026. 03. 18.) 1. (시행일) 이 규정은 2026년 03월 18일부터 시행한다."}]'
            sortOrder = 16
            chapter = "부칙"
        }
    )
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Uri 'https://rules.yewon.ac.kr/api/admin/articles/batch' -Method POST -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
$response | ConvertTo-Json -Depth 3
