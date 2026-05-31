const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  return results;
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
if (fs.existsSync(apiDir)) {
  const routes = walk(apiDir);
  routes.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    // 주석 처리된 runtime 선언을 활성화합니다.
    if (content.includes('// export const runtime = "edge";') || content.includes('//export const runtime = "edge";')) {
      content = content.replace(/\/\/ ?export const runtime = "edge";/g, 'export const runtime = "edge";');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[Build Prep] Enabled edge runtime for: ${path.relative(__dirname, filePath)}`);
    }
  });
} else {
  console.log('[Build Prep] src/app/api directory not found.');
}
