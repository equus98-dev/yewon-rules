const Database = require('better-sqlite3');
const db = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite');

// Find the rule
const rule = db.prepare(`SELECT * FROM Rule WHERE title LIKE '%학점교류%'`).get();
if (!rule) {
    console.log("Rule not found!");
    process.exit(1);
}

console.log("Rule:", rule.id, rule.title, rule.ruleNumber);

// Revisions
const revisions = db.prepare(`SELECT * FROM Revision WHERE ruleId = ? ORDER BY version ASC`).all(rule.id);
console.log("Revisions:", revisions.map(r => ({id: r.id, version: r.version, effectiveDate: r.effectiveDate})));

// Articles (Addendum)
for (const rev of revisions) {
    const articles = db.prepare(`SELECT * FROM Article WHERE revisionId = ? AND (chapter LIKE '%부칙%' OR title LIKE '%부칙%')`).all(rev.id);
    console.log(`\nAddendum Articles for Revision ${rev.version}:`);
    for (const a of articles) {
        console.log(`- ${a.id}: chapter=${a.chapter}, title=${a.title}`);
        console.log(`  contentHtml: ${a.contentHtml}`);
    }
}

// All rules
const allRules = db.prepare(`SELECT id, title, ruleNumber FROM Rule`).all();
const issues = [];

for (const r of allRules) {
    const revs = db.prepare(`SELECT * FROM Revision WHERE ruleId = ?`).all(r.id);
    for (const rev of revs) {
        const addendums = db.prepare(`SELECT * FROM Article WHERE revisionId = ? AND (chapter LIKE '%부칙%' OR title LIKE '%부칙%')`).all(rev.id);
        
        for (const a of addendums) {
            // Very simple check: does the addendum mention an enforcement date?
            // Usually it says "이 규정은 YYYY년 MM월 DD일부터 시행한다."
            const dateMatch = a.contentText.match(/(\d{4})[년\.]\s*(\d{1,2})[월\.]\s*(\d{1,2})[일\.]?\s*부터\s*시행/);
            if (dateMatch) {
                const year = dateMatch[1];
                const month = dateMatch[2].padStart(2, '0');
                const day = dateMatch[3].padStart(2, '0');
                const addendumDate = `${year}-${month}-${day}`;
                
                // EffectiveDate is YYYY-MM-DD
                let revDate = rev.effectiveDate;
                if (revDate && revDate.includes('T')) {
                    revDate = revDate.split('T')[0];
                }

                if (revDate !== addendumDate) {
                    issues.push({
                        rule: r.title,
                        ruleNumber: r.ruleNumber,
                        revDate,
                        addendumDate,
                        articleId: a.id,
                        contentText: a.contentText
                    });
                }
            } else {
                // Check format YYYY. MM. DD. 시행
                const dateMatch2 = a.contentText.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
                if (dateMatch2 && a.contentText.includes('시행')) {
                    const year = dateMatch2[1];
                    const month = dateMatch2[2].padStart(2, '0');
                    const day = dateMatch2[3].padStart(2, '0');
                    const addendumDate = `${year}-${month}-${day}`;
                    
                    let revDate = rev.effectiveDate;
                    if (revDate && revDate.includes('T')) {
                        revDate = revDate.split('T')[0];
                    }

                    if (revDate && revDate !== addendumDate) {
                        issues.push({
                            rule: r.title,
                            ruleNumber: r.ruleNumber,
                            revDate,
                            addendumDate,
                            articleId: a.id,
                            contentText: a.contentText
                        });
                    }
                }
            }
        }
    }
}

console.log(`\nFound ${issues.length} potential issues:`);
for (const issue of issues.slice(0, 10)) {
    console.log(issue);
}
