const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Fetching Rules...");
    const rulesOut = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, title, ruleNumber FROM Rule" --json`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const rules = JSON.parse(rulesOut)[0].results;

    console.log("Fetching Revisions...");
    const revsOut = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, ruleId, effectiveDate, enactmentDate, version FROM Revision" --json`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const revs = JSON.parse(revsOut)[0].results;

    console.log("Fetching Articles...");
    // Fetch all articles to ensure we don't miss any "시행일" disguised in "기타사항"
    const articlesOut = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, revisionId, chapter, title, contentText FROM Article" --json`, { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
    const articles = JSON.parse(articlesOut)[0].results;

    const ruleMap = {};
    rules.forEach(r => { ruleMap[r.id] = r; });

    // Group articles by revisionId
    const revArticlesMap = {};
    articles.forEach(a => {
        if (!revArticlesMap[a.revisionId]) revArticlesMap[a.revisionId] = [];
        revArticlesMap[a.revisionId].push(a);
    });

    const issues = [];
    const updates = [];

    revs.forEach(rev => {
        const rule = ruleMap[rev.ruleId];
        if (!rule) return;

        const revArticles = revArticlesMap[rev.id] || [];
        
        let foundDate = null;

        // Sort articles so we check them in order, usually addendums are at the end
        // But since we just want the latest/most relevant date, we can scan all.
        // We look for patterns like "이 규정은 YYYY년 MM월 DD일부터 시행한다."
        // Or "시행일.*YYYY. MM. DD."
        
        const dateRegex1 = /이\s+.*?(\d{4})[년\.]\s*(\d{1,2})[월\.]\s*(\d{1,2})[일\.]?\s*부터\s*시행/g;
        const dateRegex2 = /\(시행일\).*?(\d{4})[년\.]\s*(\d{1,2})[월\.]\s*(\d{1,2})[일\.]?/g;
        
        // Let's find all dates in the revision
        let allDates = [];

        revArticles.forEach(a => {
            const content = a.contentText || "";
            
            let match;
            while ((match = dateRegex1.exec(content)) !== null) {
                allDates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
            }
            while ((match = dateRegex2.exec(content)) !== null) {
                allDates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
            }
        });

        if (allDates.length > 0) {
            // Take the LAST date mentioned, as usually the latest addendum is appended at the end
            foundDate = allDates[allDates.length - 1];
        }

        if (foundDate) {
            let revDateStr = rev.effectiveDate;
            if (revDateStr && revDateStr.includes('T')) {
                revDateStr = revDateStr.split('T')[0];
            }

            if (revDateStr !== foundDate) {
                issues.push({
                    ruleTitle: rule.title,
                    ruleNumber: rule.ruleNumber,
                    dbDate: revDateStr,
                    textDate: foundDate
                });
                
                updates.push(`UPDATE Revision SET effectiveDate = '${foundDate}T00:00:00.000Z', enactmentDate = '${foundDate}T00:00:00.000Z' WHERE id = '${rev.id}';`);
            }
        }
    });

    console.log(`\nFound ${issues.length} potential discrepancies.`);
    
    // Save output
    const dir = 'scratch';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFileSync('scratch/date_discrepancies.json', JSON.stringify(issues, null, 2), 'utf-8');
    fs.writeFileSync('scratch/update_dates.sql', updates.join('\n'), 'utf-8');
    console.log("Saved to scratch/date_discrepancies.json and scratch/update_dates.sql");

} catch(e) {
    console.error(e.message);
}
