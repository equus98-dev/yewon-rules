const { execSync } = require('child_process');
const fs = require('fs');

function runWrangler(query) {
  fs.writeFileSync('temp.sql', query);
  const out = execSync(`npx wrangler d1 execute yewon-rules-db --remote --file temp.sql --json`, { encoding: 'utf8' });
  try {
      const idx = out.indexOf('[');
      if (idx === -1) return null;
      return JSON.parse(out.substring(idx))[0].results;
  } catch(e) {
      console.log(e);
      return null;
  }
}

function main() {
  const articles = runWrangler(`SELECT id, title, contentText FROM Article WHERE contentText LIKE '%cite%' OR contentJson LIKE '%cite%'`);
  if (!articles) return;
  for (const a of articles) {
      console.log(`TITLE: ${a.title}`);
      console.log(`TEXT: ${a.contentText}`);
  }
}
main();
