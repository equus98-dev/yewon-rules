const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const ruleIdStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id FROM Rule WHERE title LIKE \'%직제%\'" --json', { encoding: 'utf8' });
  const ruleId = JSON.parse(ruleIdStr)[0].results[0].id;
  
  // 운영 서버 API 직접 호출 (로컬 개발서버가 띄워져 있지 않으므로 Cloudflare Pages 운영 서버 URL 사용)
  const url = `https://yewon-rules.pages.dev/api/rules/${ruleId}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      fs.writeFileSync('temp_api_response.json', data, 'utf-8');
      console.log('API Response dumped to temp_api_response.json');
      
      const json = JSON.parse(data);
      const articles = json.currentRevision?.articles || [];
      const article23s = articles.filter(a => a.articleNumber === 23 || a.title?.includes("23조") || a.contentText?.includes("23조"));
      
      console.log(`\nFound ${article23s.length} articles containing '23조' in API response:`);
      article23s.forEach((a, i) => {
         console.log(`[${i+1}] ID: ${a.id}`);
         console.log(`     Num: ${a.articleNumber}, Title: ${a.title}`);
         console.log(`     Content: ${a.contentText}`);
         console.log(`     JSON: ${a.contentJson}`);
      });
    });
  }).on('error', (err) => {
    console.log('Error: ' + err.message);
  });
}

main();
