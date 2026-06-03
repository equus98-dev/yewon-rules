import * as cheerio from 'cheerio';
import fs from 'fs';

try {
  const htmlPath = 'E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_html\\정관.htm';
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  const $ = cheerio.load(html);
  
  let found77 = false;
  let tableHtml = '';

  // Iterate over all body elements
  $('body').children().each((i, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('제77조')) {
      found77 = true;
    } else if (found77) {
      if (el.tagName.toLowerCase() === 'table') {
        tableHtml = $.html(el);
        // Break out of the loop
        return false;
      } else if (text.startsWith('제78조') || text.startsWith('부 칙')) {
        // If we hit the next article without finding a table, stop
        return false;
      }
    }
  });

  if (tableHtml) {
    console.log("Table found for 제77조!");
    console.log(tableHtml.substring(0, 200) + "...");
  } else {
    console.log("Table NOT found for 제77조.");
  }
} catch (e) {
  console.error(e.message);
}
