const { execSync } = require('child_process');

try {
    const res = execSync('npx wrangler d1 execute yewon-rules-db --remote --command "SELECT contentText, contentJson FROM Article WHERE contentText LIKE \'%제14조(용원)%\' LIMIT 1" --json');
    console.log(res.toString());
} catch(e) {
    console.log(e.toString());
}
