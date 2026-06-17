SELECT a.contentText, a.contentJson, a.contentHtml 
FROM "Rule" r 
JOIN "Revision" rev ON r.id = rev.ruleId 
JOIN "Article" a ON rev.id = a.revisionId 
WHERE r.title LIKE '%정관%' AND a.title LIKE '%부칙%' 
ORDER BY a."articleNumber" ASC 
LIMIT 3;
