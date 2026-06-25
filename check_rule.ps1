$response = Invoke-RestMethod -Uri 'https://rules.yewon.ac.kr/api/rules/2a8340c1-aa3b-4c48-b843-84f8eebea2f1'
$revisionId = $response.currentRevision.id
$articles = $response.currentRevision.articles
Write-Host "Revision ID: $revisionId"
Write-Host "Total articles: $($articles.Count)"
Write-Host "---"
foreach ($a in $articles) {
    $title = $a.title
    $num = $a.articleNumber
    $sort = $a.sortOrder
    $text = if ($a.contentText.Length -gt 80) { $a.contentText.Substring(0,80) + "..." } else { $a.contentText }
    Write-Host "[$sort] Article#$num Title='$title' Text='$text'"
}
