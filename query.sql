SELECT r.id, r.title, r."ruleNumber", r.status, r."createdAt", rev."enactmentDate"
FROM "Rule" r
LEFT JOIN "Revision" rev ON r.id = rev."ruleId" AND rev.version = (SELECT MAX(version) FROM "Revision" WHERE "ruleId" = r.id)
ORDER BY r."createdAt" DESC
LIMIT 15;
