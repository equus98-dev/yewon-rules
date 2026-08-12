SELECT r.id, r.version, r."versionName", r."revisionType", r."createdAt"
FROM "Revision" r
JOIN "Rule" ru ON ru.id = r."ruleId"
WHERE ru."ruleNumber" = '5-2-16'
ORDER BY r."createdAt" ASC;
