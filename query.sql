SELECT a.id, a."contentHtml" FROM "Article" a JOIN "Revision" rev ON a."revisionId" = rev.id JOIN "Rule" r ON rev."ruleId" = r.id WHERE a."articleNumber" = 5 AND r.title LIKE '%RISE%';
