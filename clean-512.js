const fs = require('fs');
const data = JSON.parse(fs.readFileSync('512.json', 'utf-8'));

let count = 0;
data.articles.forEach(a => {
  let modified = false;
  
  let text = a.contentText;
  
  // Replace red color with nothing or remove the span
  if (text.includes('color:#ff0000') || text.includes('color: #ff0000') || text.includes('color:red') || text.includes('color: red')) {
    console.log(`Article ${a.articleNumber} has red color!`);
    text = text.replace(/color:\s*(#ff0000|red);?/gi, '');
    modified = true;
  }
  
  // Find random enters. Let's see what they look like.
  // Maybe text has \n\n or \n in the middle of a sentence?
  
  if (modified) {
    a.contentText = text;
    count++;
  }
});

console.log(`Fixed ${count} articles for red color.`);
fs.writeFileSync('512_cleaned.json', JSON.stringify(data, null, 2), 'utf-8');
