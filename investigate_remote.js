const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Fetching Rules...");
    const rulesOut = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, title, ruleNumber FROM Rule" --json`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const rules = JSON.parse(rulesOut)[0].results;

    console.log("Fetching Revisions...");
    const revsOut = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, ruleId, effectiveDate, version FROM Revision" --json`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const revs = JSON.parse(revsOut)[0].results;

    console.log("Fetching Addendums...");
    const articlesOut = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="SELECT id, revisionId, chapter, title, contentText FROM Article WHERE chapter LIKE '%부칙%' OR title LIKE '%부칙%'" --json`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const articles = JSON.parse(articlesOut)[0].results;

    const ruleMap = {};
    rules.forEach(r => { ruleMap[r.id] = r; });

    const revMap = {};
    revs.forEach(r => { revMap[r.id] = r; });

    const issues = [];
    const targetRuleTitle = "3-3-34  국내외 대학 간 학점교류 운영세칙"; // From previous search
    let targetRuleIssue = null;

    articles.forEach(a => {
        const rev = revMap[a.revisionId];
        if (!rev) return;
        const rule = ruleMap[rev.ruleId];
        if (!rule) return;

        let content = a.contentText || "";
        
        // Match "YYYY년 MM월 DD일부터 시행"
        let dateMatch = content.match(/(\d{4})[년\.]\s*(\d{1,2})[월\.]\s*(\d{1,2})[일\.]?\s*부터\s*시행/);
        let addendumDateStr = null;

        if (dateMatch) {
            addendumDateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
        } else {
            // Match "YYYY. MM. DD. 시행"
            dateMatch = content.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
            if (dateMatch && content.includes('시행')) {
                addendumDateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            }
        }

        if (addendumDateStr) {
            let revDateStr = rev.effectiveDate;
            if (revDateStr && revDateStr.includes('T')) {
                revDateStr = revDateStr.split('T')[0];
            }

            if (revDateStr !== addendumDateStr) {
                const issue = {
                    ruleId: rule.id,
                    ruleTitle: rule.title,
                    ruleNumber: rule.ruleNumber,
                    revisionId: rev.id,
                    articleId: a.id,
                    dbEffectiveDate: revDateStr,
                    addendumEffectiveDate: addendumDateStr,
                    contentText: content
                };
                issues.push(issue);

                if (rule.title.includes("학점교류 운영세칙")) {
                    targetRuleIssue = issue;
                }
            }
        }
    });

    console.log(`\nFound ${issues.length} potential discrepancies.`);
    if (targetRuleIssue) {
        console.log("\nTarget Rule Found:");
        console.log(targetRuleIssue);
    }
    
    // Save output
    const dir = 'scratch';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFileSync('scratch/addendum_discrepancies.json', JSON.stringify(issues, null, 2), 'utf-8');
    console.log("Saved to scratch/addendum_discrepancies.json");

} catch(e) {
    console.error(e.message);
}
