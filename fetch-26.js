const { execSync } = require('child_process');

try {
    const res = execSync('npx wrangler d1 execute yewon-rules-db --remote --command "SELECT contentText, contentJson FROM Article WHERE contentText LIKE \'%퇴사신고%\' LIMIT 1" --json');
    console.log(res.toString());
} catch(e) {
    console.log(e.toString());
}
