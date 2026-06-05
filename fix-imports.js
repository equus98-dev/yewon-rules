const fs = require('fs');

function fixImports(file) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('@cloudflare/next-on-pages')) {
    content = content.replace(/@cloudflare\/next-on-pages/g, '@opennextjs/cloudflare');
    content = content.replace(/getRequestContext/g, 'getCloudflareContext');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed imports in ${file}`);
  }
}

fixImports('src/app/api/admin/files/route.ts');
fixImports('src/app/api/files/[key]/route.ts');

let config = fs.readFileSync('open-next.config.ts', 'utf-8');
config = config.replace(/import cloudflare from "@opennextjs\/cloudflare";\n/, '');
fs.writeFileSync('open-next.config.ts', config, 'utf-8');
console.log('Fixed open-next.config.ts');
