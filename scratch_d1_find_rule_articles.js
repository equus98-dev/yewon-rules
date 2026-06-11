const { execSync } = require('child_process');

try {
  const outRule = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT a.id, a.title, a.contentText, a.contentHtml FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = \'f2d6fa0c-ea7e-4a89-b72b-e991017e0b28\' AND a.title LIKE \'%별지%\'"', { encoding: 'utf-8' });
  console.log('Rules:', outRule);

  // Assume first rule is the one we want. (Or we can just search for articles by ruleId later)
} catch (e) {
  console.log('Error:', e.message);
}
