SELECT a.id, a.title, a."fileUrl", a."fileType", a."ruleId" FROM "Attachment" a JOIN "Rule" r ON a."ruleId" = r.id WHERE r.title LIKE '%학칙%';
