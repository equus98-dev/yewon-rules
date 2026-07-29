CREATE INDEX IF NOT EXISTS idx_Article_revisionId ON "Article"("revisionId");
CREATE INDEX IF NOT EXISTS idx_Revision_ruleId ON "Revision"("ruleId");
CREATE INDEX IF NOT EXISTS idx_Attachment_ruleId ON "Attachment"("ruleId");
CREATE INDEX IF NOT EXISTS idx_Rule_categoryId ON "Rule"("categoryId");
CREATE INDEX IF NOT EXISTS idx_Rule_departmentId ON "Rule"("departmentId");
CREATE INDEX IF NOT EXISTS idx_ArticleComparison_revisionId ON "ArticleComparison"("revisionId");
