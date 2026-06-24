const fs = require('fs');

function run() {
  const raw = fs.readFileSync('scripts/d1_all.json', 'utf8');
  let data;
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start > -1 && end > -1) {
      data = JSON.parse(raw.substring(start, end + 1));
  } else {
      console.log('Could not find JSON array');
      return;
  }

  const rows = data[0].results;
  let sql = 'BEGIN TRANSACTION;\n';
  let updateCount = 0;

  for (const row of rows) {
    if (!row.contentJson) continue;
    let cJson;
    try {
        cJson = JSON.parse(row.contentJson);
    } catch(e) {
        continue;
    }
    
    let changed = false;

    // Fix Article 3 spaces
    if (row.articleNumber === 3 && cJson[0] && cJson[0].text && cJson[0].text.includes('교양학부')) {
        let oldText = cJson[0].text;
        let newText = oldText.replace(/,/g, ", ").replace(/, \s+/g, ", ");
        if (oldText !== newText) {
            cJson[0].text = newText;
            changed = true;
        }
    }

    // Fix nested parenthesis parsing error
    const text = cJson[0]?.text;
    const num = cJson[0]?.num;
    if (text && text.includes('①') && !text.startsWith('①')) {
      const match = text.match(/^([^①]+)(①.*)/);
      if (match) {
          const restOfTitle = match[1];
          const newText = match[2];
          const newNum = (num + restOfTitle).replace(/\s+/g, ' ').trim();
          cJson[0].num = newNum;
          cJson[0].text = newText;
          changed = true;
      }
    }

    if (changed) {
        const newJsonStr = JSON.stringify(cJson).replace(/'/g, "''");
        sql += `UPDATE Article SET contentJson = '${newJsonStr}' WHERE id = '${row.id}';\n`;
        updateCount++;
    }
  }

  sql += 'COMMIT;\n';
  
  fs.writeFileSync('scripts/update_all.sql', sql);
  console.log(`Generated SQL to update ${updateCount} rows.`);
}

run();
