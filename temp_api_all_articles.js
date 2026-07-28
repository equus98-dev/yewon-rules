const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const ruleIdStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id FROM Rule WHERE title LIKE \'%직제%\'" --json', { encoding: 'utf8' });
  const ruleId = JSON.parse(ruleIdStr)[0].results[0].id;
  
  const url = `https://yewon-rules.pages.dev/api/rules/${ruleId}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      const json = JSON.parse(data);
      const articles = json.currentRevision?.articles || [];
      
      let out = `Total articles: ${articles.length}\n\n`;
      articles.forEach((a, i) => {
         out += `[${i+1}] ID: ${a.id}\n`;
         out += `Num: ${a.articleNumber}, Title: ${a.title}\n`;
         out += `Content: ${a.contentText ? a.contentText.replace(/\\n/g, ' ') : ''}\n`;
         out += `---------------------------------------\n`;
      });
      fs.writeFileSync('temp_api_all_articles.txt', out, 'utf-8');
      console.log('Dumped all articles to temp_api_all_articles.txt');
    });
  }).on('error', (err) => {
    console.log('Error: ' + err.message);
  });
}

main();
