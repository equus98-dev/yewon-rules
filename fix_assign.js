const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');

code = code.replace(/curHo = ""; curMok = ""; currentIndent = isArticleBody \? "56px" : "88px"; currentIndent = isArticleBody \? "40px" : "72px";/g, 
    'curHo = ""; curMok = ""; currentIndent = isArticleBody ? "40px" : "72px";');

fs.writeFileSync('src/components/ArticleRenderer.tsx', code);
console.log('Fixed double assignment');
